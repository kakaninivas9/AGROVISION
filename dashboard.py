# dashboard.py — CropGuard Pro
# Run with: streamlit run dashboard.py

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from PIL import Image
from datetime import datetime

from thingspeak_api import get_latest_reading, get_history, get_moisture_history_for_prediction
from analytics import farm_health_score, predict_irrigation, generate_alerts
from disease_model import predict_disease

# ── Page config ──────────────────────────────────────────────
st.set_page_config(
    page_title="CropGuard Pro",
    page_icon="🌾",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS ───────────────────────────────────────────────
st.markdown("""
<style>
    .main { background-color: #0e1117; }
    .metric-card {
        background: #1a1f2e;
        border: 1px solid #2d3748;
        border-radius: 12px;
        padding: 18px 20px;
        text-align: center;
    }
    .metric-value { font-size: 2rem; font-weight: 700; margin: 4px 0; }
    .metric-label { font-size: 0.78rem; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; }
    .alert-critical { background:#2d1515; border-left:4px solid #ef4444; padding:10px 14px; border-radius:6px; margin:6px 0; }
    .alert-warning  { background:#2d2515; border-left:4px solid #f59e0b; padding:10px 14px; border-radius:6px; margin:6px 0; }
    .alert-info     { background:#151f2d; border-left:4px solid #3b82f6; padding:10px 14px; border-radius:6px; margin:6px 0; }
    .score-ring     { font-size: 3.5rem; font-weight: 900; text-align: center; padding: 12px 0; }
    .section-header { font-size: 1.1rem; font-weight: 600; color: #e2e8f0; margin: 20px 0 10px; border-bottom: 1px solid #2d3748; padding-bottom: 6px; }
    div[data-testid="stSidebarNav"] { background: #111827; }
</style>
""", unsafe_allow_html=True)

# ── Sidebar ──────────────────────────────────────────────────
with st.sidebar:
    st.image("https://via.placeholder.com/200x60/1a1f2e/4ade80?text=CropGuard+Pro", width=200)
    st.markdown("---")
    page = st.radio("Navigation", ["Live Dashboard", "Disease Detection", "Analytics", "Alerts"])
    st.markdown("---")
    auto_refresh = st.toggle("Auto refresh (30s)", value=False)
    if auto_refresh:
        import time
        time.sleep(30)
        st.rerun()
    st.markdown("---")
    st.caption(f"Last updated: {datetime.now().strftime('%H:%M:%S')}")
    if st.button("Refresh now"):
        st.rerun()

# ── Fetch data ───────────────────────────────────────────────
@st.cache_data(ttl=30)
def load_latest():
    return get_latest_reading()

@st.cache_data(ttl=60)
def load_history(hours=24):
    return get_history(hours=hours)

data    = load_latest()
history = load_history()

M  = data.get("moisture_pct", 55)
T  = data.get("temperature",  28)
H  = data.get("humidity",     65)
N  = data.get("nitrogen",     42)
P  = data.get("phosphorus",   35)
K  = data.get("potassium",    38)
L  = int(data.get("light", 0))
R  = int(data.get("rain",  0))

score, breakdown, status, score_color = farm_health_score(M, T, H, N, P, K)
alerts = generate_alerts(M, T, H, N, P, K, bool(R), False, L == 0)
moisture_hist = get_moisture_history_for_prediction(hours=6)
irrigation    = predict_irrigation(moisture_hist, rain_forecast=bool(R))

# ════════════════════════════════════════════════════════════
#  PAGE: LIVE DASHBOARD
# ════════════════════════════════════════════════════════════
if page == "Live Dashboard":
    st.title("🌾 CropGuard Pro — Live Farm Dashboard")

    # ── Top KPI row ──
    cols = st.columns([1.4, 1, 1, 1, 1, 1, 1])

    score_colors_map = {"Excellent":"#4ade80","Good":"#3b82f6","Fair":"#f59e0b","Critical":"#ef4444"}
    sc = score_colors_map.get(status, "#94a3b8")

    with cols[0]:
        st.markdown(f"""<div class="metric-card">
            <div class="metric-label">Farm health score</div>
            <div class="metric-value" style="color:{sc};">{score}</div>
            <div style="color:{sc};font-size:0.85rem;font-weight:600;">{status}</div>
        </div>""", unsafe_allow_html=True)

    sensor_kpis = [
        ("Soil moisture", f"{M:.0f}%",  "#a855f7"),
        ("Temperature",  f"{T:.1f}°C", "#f59e0b"),
        ("Humidity",     f"{H:.0f}%",  "#3b82f6"),
        ("Nitrogen",     f"{N:.0f}",   "#22c55e"),
        ("Phosphorus",   f"{P:.0f}",   "#06b6d4"),
        ("Potassium",    f"{K:.0f}",   "#e879f9"),
    ]
    for col, (label, value, color) in zip(cols[1:], sensor_kpis):
        with col:
            st.markdown(f"""<div class="metric-card">
                <div class="metric-label">{label}</div>
                <div class="metric-value" style="color:{color};">{value}</div>
            </div>""", unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # ── Status pills row ──
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Rain",       "Raining" if R else "Dry",  delta=None)
    c2.metric("Sunlight",   "Low"     if L else "Good", delta=None)
    c3.metric("Irrigation", "Needed" if irrigation["irrigate_now"] else "OK", delta=None)
    c4.metric("Alerts",     f"{len(alerts)} active", delta=None)

    st.markdown("---")

    # ── Trend charts ──
    left, right = st.columns(2)

    with left:
        st.markdown('<div class="section-header">Moisture trend (24h)</div>', unsafe_allow_html=True)
        if not history.empty and "moisture_pct" in history.columns:
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=history.index, y=history["moisture_pct"],
                fill="tozeroy", fillcolor="rgba(168,85,247,0.15)",
                line=dict(color="#a855f7", width=2),
                name="Moisture %"
            ))
            fig.add_hline(y=40, line_dash="dash", line_color="#ef4444",
                          annotation_text="Dry threshold")
            fig.update_layout(template="plotly_dark", height=250,
                              margin=dict(l=0,r=0,t=10,b=0),
                              showlegend=False)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Waiting for historical data...")

    with right:
        st.markdown('<div class="section-header">Temperature & humidity (24h)</div>', unsafe_allow_html=True)
        if not history.empty:
            fig = go.Figure()
            if "temperature" in history.columns:
                fig.add_trace(go.Scatter(x=history.index, y=history["temperature"],
                    line=dict(color="#f59e0b", width=2), name="Temp °C"))
            if "humidity" in history.columns:
                fig.add_trace(go.Scatter(x=history.index, y=history["humidity"],
                    line=dict(color="#3b82f6", width=2), name="Humidity %",
                    yaxis="y2"))
            fig.update_layout(
                template="plotly_dark", height=250,
                margin=dict(l=0,r=0,t=10,b=0),
                yaxis2=dict(overlaying="y", side="right"),
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Waiting for historical data...")

    # ── NPK bar chart ──
    st.markdown('<div class="section-header">NPK soil nutrients</div>', unsafe_allow_html=True)
    npk_fig = go.Figure(go.Bar(
        x=["Nitrogen (N)", "Phosphorus (P)", "Potassium (K)"],
        y=[N, P, K],
        marker_color=["#22c55e", "#06b6d4", "#e879f9"],
        text=[f"{N:.0f}", f"{P:.0f}", f"{K:.0f}"],
        textposition="outside",
    ))
    npk_fig.add_hline(y=30, line_dash="dash", line_color="#f59e0b",
                      annotation_text="Minimum healthy level")
    npk_fig.update_layout(template="plotly_dark", height=220,
                          margin=dict(l=0,r=0,t=10,b=0))
    st.plotly_chart(npk_fig, use_container_width=True)

    # ── Health score breakdown ──
    st.markdown('<div class="section-header">Health score breakdown</div>', unsafe_allow_html=True)
    params  = list(breakdown.keys())
    scores_ = list(breakdown.values())
    radar_fig = go.Figure(go.Scatterpolar(
        r=scores_ + [scores_[0]],
        theta=params + [params[0]],
        fill="toself",
        fillcolor="rgba(74,222,128,0.15)",
        line=dict(color="#4ade80"),
    ))
    radar_fig.update_layout(
        polar=dict(radialaxis=dict(visible=True, range=[0, 100])),
        template="plotly_dark", height=320,
        margin=dict(l=40, r=40, t=20, b=20),
    )
    st.plotly_chart(radar_fig, use_container_width=True)

    # ── Irrigation prediction ──
    st.markdown('<div class="section-header">Predictive irrigation</div>', unsafe_allow_html=True)
    ic1, ic2, ic3 = st.columns(3)
    ic1.metric("Irrigate now?", "YES" if irrigation["irrigate_now"] else "NO")
    ic2.metric("Predicted moisture (6h)", f"{irrigation['predicted_moisture'] or '—'}%")
    ic3.metric("Hours until dry", f"{irrigation['hours_until_dry'] or '—'}h")
    st.caption(f"Confidence: {irrigation['confidence'].upper()} — {irrigation['reason']}")


# ════════════════════════════════════════════════════════════
#  PAGE: DISEASE DETECTION
# ════════════════════════════════════════════════════════════
elif page == "Disease Detection":
    st.title("AI Crop Disease Detection")
    st.caption("Upload a photo of a crop leaf. The CNN model will identify the disease and suggest treatment.")

    uploaded = st.file_uploader("Upload leaf image", type=["jpg", "jpeg", "png"])

    if uploaded:
        img = Image.open(uploaded)
        col_img, col_result = st.columns([1, 1.4])

        with col_img:
            st.image(img, caption="Uploaded leaf", use_column_width=True)

        with col_result:
            with st.spinner("Analyzing with CNN model..."):
                result = predict_disease(img)

            conf_color = "#4ade80" if result["is_healthy"] else (
                "#ef4444" if result["confidence"] > 70 else "#f59e0b")

            st.markdown(f"""
            <div style="background:#1a1f2e;border-radius:12px;padding:20px;border:1px solid #2d3748;">
                <div style="font-size:0.75rem;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Detected</div>
                <div style="font-size:1.4rem;font-weight:700;color:{conf_color};margin-bottom:6px;">{result['disease']}</div>
                <div style="font-size:0.9rem;color:#94a3b8;">Confidence: <strong style="color:{conf_color};">{result['confidence']}%</strong></div>
            </div>""", unsafe_allow_html=True)

            st.markdown("<br>", unsafe_allow_html=True)
            st.markdown("**Treatment recommendation**")
            st.info(result["treatment"])

            st.markdown("**Top 3 predictions**")
            for cls, conf in result["top3"]:
                st.progress(int(conf), text=f"{cls.replace('___',' — ').replace('_',' ')} — {conf}%")
    else:
        st.info("Please upload a leaf photo to begin disease analysis.")
        st.markdown("**Supported crops:** Tomato, Potato, Corn, Rice, Grape, Apple, Pepper, Peach, Cherry, Strawberry, Squash, Blueberry, Soybean, Raspberry")


# ════════════════════════════════════════════════════════════
#  PAGE: ANALYTICS
# ════════════════════════════════════════════════════════════
elif page == "Analytics":
    st.title("Analytics")

    range_hours = st.select_slider("Time range", options=[6, 12, 24, 48, 72], value=24)
    hist = load_history(hours=range_hours)

    if hist.empty:
        st.warning("No historical data available yet.")
    else:
        st.subheader("All sensor trends")
        for col_name, label, color in [
            ("moisture_pct", "Soil moisture %",  "#a855f7"),
            ("temperature",  "Temperature °C",   "#f59e0b"),
            ("humidity",     "Humidity %",        "#3b82f6"),
            ("nitrogen",     "Nitrogen",          "#22c55e"),
            ("phosphorus",   "Phosphorus",        "#06b6d4"),
            ("potassium",    "Potassium",         "#e879f9"),
        ]:
            if col_name in hist.columns:
                fig = px.line(hist, y=col_name, title=label,
                              color_discrete_sequence=[color])
                fig.update_layout(template="plotly_dark", height=200,
                                  margin=dict(l=0,r=0,t=30,b=0))
                st.plotly_chart(fig, use_container_width=True)

        st.subheader("Correlation heatmap")
        numeric = hist.select_dtypes(include="number")
        if len(numeric.columns) > 1:
            corr = numeric.corr()
            hm = go.Figure(go.Heatmap(
                z=corr.values, x=corr.columns, y=corr.index,
                colorscale="RdYlGn", zmid=0,
            ))
            hm.update_layout(template="plotly_dark", height=360,
                             margin=dict(l=0,r=0,t=10,b=0))
            st.plotly_chart(hm, use_container_width=True)


# ════════════════════════════════════════════════════════════
#  PAGE: ALERTS
# ════════════════════════════════════════════════════════════
elif page == "Alerts":
    st.title("Smart Alerts")

    if not alerts:
        st.success("All systems normal. No active alerts.")
    else:
        st.warning(f"{len(alerts)} alert(s) require attention.")
        for a in alerts:
            css_class = f"alert-{a['level']}"
            icon = {"critical": "🔴", "warning": "🟡", "info": "🔵"}.get(a["level"], "⚪")
            st.markdown(
                f'<div class="{css_class}">{icon} <strong>{a["level"].upper()}</strong>'
                f' [{a["param"]}] — {a["message"]} <span style="color:#64748b;float:right">{a["time"]}</span></div>',
                unsafe_allow_html=True
            )

    st.markdown("---")
    st.subheader("Alert history (last 24h)")
    if not history.empty:
        st.dataframe(
            history[["moisture_pct","temperature","humidity","nitrogen","phosphorus","potassium","rain","light"]]
            .rename(columns={"moisture_pct":"Moisture%","temperature":"Temp°C",
                             "humidity":"Humidity%","nitrogen":"N","phosphorus":"P",
                             "potassium":"K","rain":"Rain","light":"LowLight"}),
            use_container_width=True
        )
