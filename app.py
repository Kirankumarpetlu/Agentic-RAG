"""
app.py – Streamlit web UI for the Document Q&A System.

Upload a file (PDF / CSV / JSON), then ask questions interactively.
Run with:  streamlit run app.py
"""

import json
import os
import tempfile

import streamlit as st

from ingestion.file_router import route_file
from ingestion.pdf_parser import parse_pdf
from ingestion.csv_parser import parse_csv
from ingestion.json_parser import parse_json
from ingestion.chunker import chunk_text
from ingestion.embedder import embed_chunks

from vector_store.faiss_store import FAISSStore

from agents.planner import plan_query
from agents.retriever import retrieve
from agents.tool_executor import execute as execute_tool
from agents.reasoner import reason


# ── Page config ──────────────────────────────────────────
st.set_page_config(page_title="📘 Document Q&A", page_icon="📘", layout="wide")

# ── Custom styling ───────────────────────────────────────
st.markdown("""
<style>
    .main { background-color: #0e1117; }
    .stApp { max-width: 1100px; margin: 0 auto; }

    .header-block {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem 2.5rem;
        border-radius: 16px;
        margin-bottom: 2rem;
        text-align: center;
    }
    .header-block h1 { color: #fff; font-size: 2.2rem; margin: 0; }
    .header-block p  { color: #e0d4f5; font-size: 1.05rem; margin-top: 0.4rem; }

    .status-card {
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 12px;
        padding: 1rem 1.5rem;
        margin-bottom: 1rem;
    }

    .answer-box {
        background: linear-gradient(135deg, #1a1f36 0%, #1e2740 100%);
        border: 1px solid #3d5af1;
        border-radius: 14px;
        padding: 1.5rem 2rem;
        margin-top: 1rem;
    }
    .answer-box h4 { color: #7b8cff; margin-top: 0; }

    .metric-row {
        display: flex; gap: 1rem; margin-top: 0.8rem;
    }
    .metric-item {
        background: #21262d;
        border-radius: 10px;
        padding: 0.8rem 1.2rem;
        flex: 1;
        text-align: center;
    }
    .metric-item .label { color: #8b949e; font-size: 0.82rem; }
    .metric-item .value { color: #f0f6fc; font-size: 1.15rem; font-weight: 600; }

    .step-badge {
        display: inline-block;
        background: #238636;
        color: #fff;
        padding: 0.2rem 0.6rem;
        border-radius: 6px;
        font-size: 0.8rem;
        margin-right: 0.4rem;
    }
</style>
""", unsafe_allow_html=True)


# ── Header ───────────────────────────────────────────────
st.markdown("""
<div class="header-block">
    <h1>📘 Document Q&A System</h1>
    <p>Upload a PDF, CSV, or JSON file and ask questions about it</p>
</div>
""", unsafe_allow_html=True)


# ── Session state init ───────────────────────────────────
if "store" not in st.session_state:
    st.session_state.store = None
if "dataframe" not in st.session_state:
    st.session_state.dataframe = None
if "ingested" not in st.session_state:
    st.session_state.ingested = False
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []


# ── Sidebar: File Upload ─────────────────────────────────
with st.sidebar:
    st.markdown("### 📂 Upload File")
    uploaded_file = st.file_uploader(
        "Choose a file",
        type=["pdf", "csv", "json"],
        help="Supported formats: PDF, CSV, JSON",
    )

    if uploaded_file and not st.session_state.ingested:
        if st.button("🚀 Ingest File", use_container_width=True):
            with st.spinner("Processing..."):
                # Save uploaded file to temp location
                suffix = os.path.splitext(uploaded_file.name)[1]
                with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                    tmp.write(uploaded_file.getbuffer())
                    tmp_path = tmp.name

                try:
                    # Detect type
                    file_type = route_file(tmp_path)
                    st.info(f"📄 Detected: **{file_type.upper()}**")

                    # Parse
                    dataframe = None
                    if file_type == "pdf":
                        text = parse_pdf(tmp_path)
                    elif file_type == "csv":
                        text, dataframe = parse_csv(tmp_path)
                    elif file_type == "json":
                        text, _ = parse_json(tmp_path)

                    # Chunk
                    chunks = chunk_text(text, source=uploaded_file.name)
                    st.info(f"🔪 {len(chunks)} chunks created")

                    # Embed
                    embeddings = embed_chunks(chunks)
                    st.info(f"🧠 Embeddings: {embeddings.shape}")

                    # Store
                    store = FAISSStore(dimension=embeddings.shape[1])
                    store.add(embeddings, chunks)

                    st.session_state.store = store
                    st.session_state.dataframe = dataframe
                    st.session_state.ingested = True
                    st.session_state.chat_history = []

                    st.success(f"✅ **{uploaded_file.name}** ingested! {store.index.ntotal} vectors stored.")

                except Exception as e:
                    st.error(f"❌ {e}")
                finally:
                    os.unlink(tmp_path)

    if st.session_state.ingested:
        st.success("✅ File loaded — ask questions below!")
        if st.button("🔄 Upload New File", use_container_width=True):
            st.session_state.store = None
            st.session_state.dataframe = None
            st.session_state.ingested = False
            st.session_state.chat_history = []
            st.rerun()


# ── Main area: Q&A ───────────────────────────────────────
if not st.session_state.ingested:
    st.markdown("""
    <div class="status-card">
        <h3 style="color: #8b949e; margin: 0;">👈 Upload a file to get started</h3>
        <p style="color: #6e7681;">Supported: PDF, CSV, JSON</p>
    </div>
    """, unsafe_allow_html=True)
else:
    # Display chat history
    for entry in st.session_state.chat_history:
        with st.chat_message("user"):
            st.write(entry["question"])
        with st.chat_message("assistant"):
            st.markdown(f"""
            <div class="answer-box">
                <h4>📌 Answer</h4>
                <p style="color: #e6edf3; font-size: 1.02rem;">{entry['answer']}</p>
                <div class="metric-row">
                    <div class="metric-item">
                        <div class="label">Confidence</div>
                        <div class="value">{entry['confidence']}</div>
                    </div>
                    <div class="metric-item">
                        <div class="label">Sources Used</div>
                        <div class="value">{entry['sources_used']}</div>
                    </div>
                    <div class="metric-item">
                        <div class="label">Analysis Type</div>
                        <div class="value">{entry['analysis_type']}</div>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)

    # Chat input
    query = st.chat_input("Ask a question about your document...")

    if query:
        with st.chat_message("user"):
            st.write(query)

        with st.chat_message("assistant"):
            with st.status("🔍 Processing...", expanded=True) as status:

                # Step 1: Plan
                st.write("🔍 **Planning query...**")
                plan = plan_query(query)
                st.json(plan)

                # Step 2: Retrieve
                st.write("📚 **Retrieving relevant chunks...**")
                results = retrieve(query, st.session_state.store, top_k=5)
                chunks_text = "\n\n---\n\n".join(
                    f"Chunk {r['metadata'].get('chunk_index', i)}:\n{r['text']}"
                    for i, r in enumerate(results)
                )
                st.write(f"Found **{len(results)}** relevant chunks")

                # Step 3: Tool (if numeric)
                metrics = None
                if plan.get("needs_numeric") and st.session_state.dataframe is not None:
                    st.write("🔢 **Running numeric analysis...**")
                    try:
                        df = st.session_state.dataframe
                        numeric_cols = df.select_dtypes(include="number").columns.tolist()
                        if numeric_cols:
                            metrics = execute_tool(df, "average", numeric_cols[0])
                            st.json(metrics)
                    except Exception as e:
                        st.warning(f"⚠️ Tool: {e}")

                # Step 4: Reason
                st.write("💡 **Generating answer...**")
                result = reason(query, chunks_text, metrics)

                status.update(label="✅ Done!", state="complete")

            # Display answer
            answer = result.get("answer", "N/A")
            confidence = result.get("confidence", "N/A")
            sources_used = result.get("sources_used", "N/A")
            analysis_type = plan.get("analysis_type", "N/A")

            st.markdown(f"""
            <div class="answer-box">
                <h4>📌 Answer</h4>
                <p style="color: #e6edf3; font-size: 1.02rem;">{answer}</p>
                <div class="metric-row">
                    <div class="metric-item">
                        <div class="label">Confidence</div>
                        <div class="value">{confidence}</div>
                    </div>
                    <div class="metric-item">
                        <div class="label">Sources Used</div>
                        <div class="value">{sources_used}</div>
                    </div>
                    <div class="metric-item">
                        <div class="label">Analysis Type</div>
                        <div class="value">{analysis_type}</div>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)

            # Save to history
            st.session_state.chat_history.append({
                "question": query,
                "answer": answer,
                "confidence": confidence,
                "sources_used": sources_used,
                "analysis_type": analysis_type,
            })
