import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Leaf, Lock, Mail, AlertCircle, Globe, TrendingUp, Shield, Zap, ChevronRight, Users } from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Animated Stat Counter ─────────────────────────────────────────── */
const Counter = ({ target, suffix = '', decimals = 0 }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 80;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(start);
    }, 20);
    return () => clearInterval(timer);
  }, [target]);
  return <>{decimals > 0 ? val.toFixed(decimals) : Math.floor(val)}{suffix}</>;
};

/* ── Rotating Earth (Canvas) ────────────────────────────────────────── */
const RotatingEarth = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = 320;
    const H = canvas.height = 320;
    const cx = W / 2, cy = H / 2, R = 130;

    const continents = [
      { lat: 45,  lng: -100, rx: 38, ry: 28, color: '#16a34a' },
      { lat: -15, lng: -60,  rx: 22, ry: 35, color: '#15803d' },
      { lat: 50,  lng: 15,   rx: 18, ry: 14, color: '#22c55e' },
      { lat: 0,   lng: 20,   rx: 22, ry: 35, color: '#16a34a' },
      { lat: 50,  lng: 90,   rx: 50, ry: 28, color: '#15803d' },
      { lat: -25, lng: 135,  rx: 18, ry: 14, color: '#22c55e' },
      { lat: 72,  lng: -42,  rx: 14, ry: 10, color: '#86efac' },
      { lat: -85, lng: 0,    rx: 60, ry: 8,  color: '#bbf7d0' },
    ];

    let angle = 0;
    let animId;

    const toXY = (lat, lng, rotLng) => {
      const latR = (lat * Math.PI) / 180;
      const lngR = ((lng + rotLng) * Math.PI) / 180;
      const x = cx + R * Math.cos(latR) * Math.sin(lngR);
      const y = cy - R * Math.sin(latR);
      const z = Math.cos(latR) * Math.cos(lngR);
      return { x, y, z };
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Outer glow
      const glow = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.18);
      glow.addColorStop(0, 'rgba(16,185,129,0.0)');
      glow.addColorStop(1, 'rgba(16,185,129,0.22)');
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
      ctx.fillStyle = glow; ctx.fill();

      // Ocean
      const ocean = ctx.createRadialGradient(cx - 35, cy - 35, 10, cx, cy, R);
      ocean.addColorStop(0, '#bae6fd');
      ocean.addColorStop(0.45, '#38bdf8');
      ocean.addColorStop(1, '#0369a1');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = ocean; ctx.fill();

      // Grid lines
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 0.8;
      for (let lat = -60; lat <= 60; lat += 30) {
        const latR = (lat * Math.PI) / 180;
        const yLat = cy - R * Math.sin(latR);
        const rLat = R * Math.cos(latR);
        ctx.beginPath(); ctx.ellipse(cx, yLat, rLat, rLat * 0.22, 0, 0, Math.PI * 2); ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + (angle * Math.PI) / 180;
        ctx.beginPath(); ctx.ellipse(cx, cy, R * Math.abs(Math.sin(a)), R, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();

      // Continents
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
      for (const c of continents) {
        const { x, y, z } = toXY(c.lat, c.lng, angle);
        if (z < -0.1) continue;
        const alpha = Math.max(0, z);
        const scaleX = Math.abs(Math.cos(((c.lng + angle) * Math.PI) / 180));
        const exRx = (c.rx / 180) * R * 2.2 * scaleX;
        const exRy = (c.ry / 90) * R * 0.9;
        ctx.save();
        ctx.globalAlpha = 0.55 + alpha * 0.45;
        ctx.beginPath(); ctx.ellipse(x, y, Math.max(2, exRx), Math.max(2, exRy), 0, 0, Math.PI * 2);
        ctx.fillStyle = c.color; ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // Atmosphere rim
      const atmo = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R);
      atmo.addColorStop(0, 'rgba(255,255,255,0)');
      atmo.addColorStop(1, 'rgba(186,230,253,0.35)');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = atmo; ctx.fill();

      // Specular
      const spec = ctx.createRadialGradient(cx - 45, cy - 45, 5, cx - 30, cy - 30, R * 0.7);
      spec.addColorStop(0, 'rgba(255,255,255,0.35)');
      spec.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = spec; ctx.fill();

      // Night shadow
      const shadow = ctx.createRadialGradient(cx + R * 0.6, cy, 0, cx + R * 0.3, cy, R * 1.1);
      shadow.addColorStop(0, 'rgba(0,0,0,0)');
      shadow.addColorStop(0.5, 'rgba(0,10,30,0.15)');
      shadow.addColorStop(1, 'rgba(0,10,60,0.55)');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = shadow; ctx.fill();

      // Orbit ring
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(-0.25); ctx.scale(1, 0.35);
      ctx.beginPath(); ctx.arc(0, 0, R * 1.22, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(16,185,129,0.25)'; ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 8]); ctx.stroke();
      ctx.restore();

      // Satellite dot
      const satA = (angle * 2 * Math.PI) / 360;
      const satOX = cx + R * 1.22 * Math.cos(satA) * Math.cos(-0.25) - R * 1.22 * Math.sin(satA) * 0.35 * Math.sin(-0.25);
      const satOY = cy + R * 1.22 * Math.cos(satA) * Math.sin(-0.25) + R * 1.22 * Math.sin(satA) * 0.35 * Math.cos(-0.25);
      ctx.shadowColor = '#34d399'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(satOX, satOY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#34d399'; ctx.fill(); ctx.shadowBlur = 0;

      angle = (angle + 0.35) % 360;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 320, height: 320, filter: 'drop-shadow(0 0 40px rgba(16,185,129,0.35))' }}
    />
  );
};

/* ── Floating Particle ──────────────────────────────────────────────── */
const Particle = ({ style, className }) => (
  <div
    className={className}
    style={{
      position: 'absolute',
      width: 4, height: 4,
      borderRadius: '50%',
      background: 'rgba(52,211,153,0.6)',
      boxShadow: '0 0 8px rgba(52,211,153,0.8)',
      pointerEvents: 'none',
      ...style,
    }}
  />
);

/* ── Main Login Component ───────────────────────────────────────────── */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      toast.success('Welcome back!');
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  const handleFillAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  const stats = [
    { icon: Globe,      label: 'Countries Tracked', value: 142,  suffix: '+', decimals: 0, color: '#34d399' },
    { icon: TrendingUp, label: 'CO₂ Reduced (kt)',  value: 8.4,  suffix: 'k', decimals: 1, color: '#60a5fa' },
    { icon: Users,      label: 'Organizations',     value: 2300, suffix: '+', decimals: 0, color: '#a78bfa' },
    { icon: Shield,     label: 'ESG Score Avg',     value: 87,   suffix: '%', decimals: 0, color: '#f472b6' },
  ];

  const particles = [
    { top: '10%', left: '8%',  animationDelay: '0s',   animationDuration: '6s'  },
    { top: '25%', left: '18%', animationDelay: '1s',   animationDuration: '8s'  },
    { top: '60%', left: '5%',  animationDelay: '2s',   animationDuration: '7s'  },
    { top: '80%', left: '22%', animationDelay: '0.5s', animationDuration: '9s'  },
    { top: '40%', left: '30%', animationDelay: '3s',   animationDuration: '5s'  },
    { top: '70%', left: '35%', animationDelay: '1.5s', animationDuration: '10s' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        .eco-login * { font-family: 'Inter', sans-serif !important; }

        @keyframes ecoFloatUp {
          0%,100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50%      { transform: translateY(-28px) scale(1.2); opacity: 1; }
        }
        @keyframes ecoPulseRing {
          0%   { box-shadow: 0 0 0 0 rgba(52,211,153,0.35); }
          70%  { box-shadow: 0 0 0 22px rgba(52,211,153,0); }
          100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); }
        }
        @keyframes ecoSlideIn {
          from { opacity: 0; transform: translateX(36px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes ecoFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ecoBlink {
          0%,100% { opacity: 1; } 50% { opacity: 0.2; }
        }
        @keyframes ecoSpin {
          from { transform: rotate(0deg); } to { transform: rotate(360deg); }
        }
        @keyframes ecoScan {
          0%   { top: 5%; opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.6; }
          100% { top: 95%; opacity: 0; }
        }

        .eco-particle { animation: ecoFloatUp var(--dur) ease-in-out infinite; animation-delay: var(--delay); }
        .eco-earth-pulse { animation: ecoPulseRing 2.5s ease infinite; border-radius: 50%; display: inline-block; }
        .eco-form-panel { animation: ecoSlideIn 0.65s cubic-bezier(0.22,1,0.36,1) both; }
        .eco-stat { animation: ecoFadeUp 0.7s ease both; transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease; }
        .eco-stat:nth-child(2) { animation-delay: 0.08s; }
        .eco-stat:nth-child(3) { animation-delay: 0.16s; }
        .eco-stat:nth-child(4) { animation-delay: 0.24s; }
        .eco-stat:hover { transform: translateY(-4px) scale(1.03); box-shadow: 0 12px 32px rgba(15,118,110,0.12) !important; }

        .eco-input {
          width: 100%;
          background: #ffffff;
          border: 1px solid #dbe4df;
          border-radius: 12px;
          padding: 13px 14px 13px 44px;
          color: #0f172a;
          font-size: 14px;
          outline: none;
          transition: all 0.25s ease;
          box-sizing: border-box;
        }
        .eco-input::placeholder { color: #94a3b8; }
        .eco-input:focus {
          border-color: rgba(52,211,153,0.55);
          background: #f0fdf4;
          box-shadow: 0 0 0 3px rgba(52,211,153,0.13);
        }

        .eco-sign-btn {
          width: 100%;
          background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
          border: none;
          border-radius: 12px;
          padding: 14px;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          letter-spacing: 0.3px;
          box-sizing: border-box;
        }
        .eco-sign-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, #34d399 0%, #2dd4bf 100%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .eco-sign-btn:hover::before { opacity: 1; }
        .eco-sign-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(52,211,153,0.38); }
        .eco-sign-btn:active { transform: translateY(0); }
        .eco-sign-btn span { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .eco-sign-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

        .eco-demo-btn {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 12px;
          text-align: left;
          cursor: pointer;
          transition: all 0.25s ease;
          width: 100%;
        }
        .eco-demo-btn:hover {
          background: #f0fdf4;
          border-color: rgba(52,211,153,0.28);
          transform: translateX(3px);
        }

        .eco-scan {
          position: absolute;
          left: 0; right: 0; height: 1.5px;
          background: linear-gradient(90deg, transparent, rgba(52,211,153,0.45), transparent);
          animation: ecoScan 4s ease-in-out infinite;
          pointer-events: none;
          z-index: 5;
        }
      `}</style>

      <div className="eco-login" style={{ display: 'contents' }}>

        {/* ── LEFT PANEL ────────────────────────────────────────────────── */}
        <div style={{
          width: '55%',
          minHeight: '100vh',
          background: 'linear-gradient(145deg, #ecfdf5 0%, #f8fafc 48%, #dcfce7 100%)',
          borderRight: '1px solid #d1fae5',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="hidden lg:flex"
        >
          {/* Grid overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(16,185,129,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          {/* Center glow */}
          <div style={{
            position: 'absolute', top: '38%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 500, height: 500,
            background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Particles */}
          {particles.map((p, i) => (
            <Particle
              key={i}
              className="eco-particle"
              style={{ top: p.top, left: p.left, '--dur': p.animationDuration, '--delay': p.animationDelay }}
            />
          ))}

          {/* Header */}
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: 12, padding: 32 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #059669, #0d9488)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(52,211,153,0.4)',
              flexShrink: 0,
            }}>
              <Leaf size={18} color="white" />
            </div>
            <div>
              <p style={{ color: '#0f172a', fontWeight: 800, fontSize: 16, lineHeight: 1, margin: 0 }}>EcoSphere</p>
              <p style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', margin: 0 }}>ESG PLATFORM</p>
            </div>
            <div style={{
              marginLeft: 'auto',
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(52,211,153,0.12)',
              border: '1px solid rgba(52,211,153,0.25)',
              borderRadius: 999, padding: '3px 10px',
              fontSize: 11, color: '#6ee7b7', fontWeight: 700, letterSpacing: '0.5px',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'ecoBlink 1.5s ease infinite' }} />
              LIVE
            </div>
          </div>

          {/* Earth + Headline + Stats */}
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, paddingBottom: 20 }}>
            <div style={{ position: 'relative' }}>
              <div className="eco-earth-pulse">
                <RotatingEarth />
              </div>
              <div className="eco-scan" />
            </div>

            <div style={{ textAlign: 'center', marginTop: 24, maxWidth: 380, padding: '0 16px' }}>
              <h2 style={{
                fontSize: 28, fontWeight: 900, lineHeight: 1.2, margin: 0,
                background: 'linear-gradient(135deg, #0f172a, #475569)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Measure. Manage.<br />
                <span style={{
                  background: 'linear-gradient(135deg, #34d399, #2dd4bf)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Transform.</span>
              </h2>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 10, lineHeight: 1.65 }}>
                Real-time ESG intelligence for forward-thinking organizations
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 28, width: 380, padding: '0 16px', boxSizing: 'border-box' }}>
              {stats.map((s, i) => (
                <div key={i} className="eco-stat" style={{
                  background: 'rgba(255,255,255,0.88)',
                  border: '1px solid #d1fae5',
                  borderRadius: 14, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${s.color}18`, border: `1px solid ${s.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <s.icon size={16} color={s.color} />
                  </div>
                  <div>
                    <p style={{ color: '#0f172a', fontSize: 18, fontWeight: 800, lineHeight: 1, margin: 0 }}>
                      <Counter target={s.value} suffix={s.suffix} decimals={s.decimals} />
                    </p>
                    <p style={{ color: '#64748b', fontSize: 10, fontWeight: 600, margin: '3px 0 0', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                      {s.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            position: 'relative', zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 32, borderTop: '1px solid #d1fae5',
          }}>
            {[
              { icon: Shield, text: 'ISO 14001 Certified' },
              { icon: Zap,    text: 'Real-time Data' },
              { icon: Globe,  text: 'TCFD Aligned' },
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: 11, fontWeight: 600 }}>
                <b.icon size={13} color="#34d399" />
                {b.text}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1, minHeight: '100vh',
            background: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '40px 24px',
            position: 'relative',
          }}
        >
          {/* Corner glow */}
          <div style={{
            position: 'absolute', top: -80, right: -80,
            width: 280, height: 280,
            background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div className="eco-form-panel" style={{ width: '100%', maxWidth: 420 }}>

            {/* Mobile logo */}
            <div className="flex lg:hidden" style={{ alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #059669, #0d9488)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Leaf size={16} color="white" />
              </div>
              <span style={{ color: '#0f172a', fontWeight: 800, fontSize: 18 }}>EcoSphere ESG</span>
            </div>

            {/* Heading */}
            <div style={{ marginBottom: 30 }}>
              <p style={{ color: '#34d399', fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 8px' }}>
                Welcome back
              </p>
              <h1 style={{
                fontSize: 30, fontWeight: 900, lineHeight: 1.1, margin: '0 0 10px',
                background: 'linear-gradient(135deg, #0f172a 30%, #334155)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Sign in to your<br />organization
              </h1>
              <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
                Access your ESG dashboard and sustainability insights
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid rgba(239,68,68,0.22)',
                borderRadius: 12, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
              }}>
                <AlertCircle size={15} color="#f87171" style={{ flexShrink: 0 }} />
                <span style={{ color: '#b91c1c', fontSize: 13 }}>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Email */}
              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} color="#475569" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="eco-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="#475569" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="eco-input"
                    style={{ paddingRight: 52 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#475569', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
                    }}
                  >
                    {showPass ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="eco-sign-btn" style={{ marginTop: 4 }}>
                <span>
                  {loading ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation: 'ecoSpin 0.8s linear infinite' }}>
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                      Authenticating...
                    </>
                  ) : (
                    <>Sign In <ChevronRight size={16} /></>
                  )}
                </span>
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ color: '#64748b', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>QUICK ACCESS</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>

            {/* Demo accounts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'System Admin',   sub: 'Full operations',       email: 'admin@ecosphere.com',    pass: 'Admin@123',    color: '#059669' },
                { label: 'ESG Manager',    sub: 'Goals & CSR',           email: 'manager@ecosphere.com',  pass: 'Manager@123',  color: '#047857' },
                { label: 'Jane Employee',  sub: 'CSR participation',     email: 'employee@ecosphere.com', pass: 'Employee@123', color: '#16a34a' },
                { label: 'Audit Reviewer', sub: 'Compliance management', email: 'auditor@ecosphere.com',  pass: 'Auditor@123',  color: '#0d9488' },
              ].map((d, i) => (
                <button key={i} className="eco-demo-btn" onClick={() => handleFillAccount(d.email, d.pass)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <p style={{ color: d.color, fontSize: 11, fontWeight: 700, margin: 0 }}>{d.label}</p>
                  </div>
                  <p style={{ color: '#475569', fontSize: 10, fontWeight: 500, margin: 0, paddingLeft: 12 }}>{d.sub}</p>
                </button>
              ))}
            </div>

            {/* Footer */}
            <p style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center', marginTop: 28 }}>
              Protected by end-to-end encryption ·{' '}
              <span style={{ color: '#34d399', cursor: 'pointer' }}>Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

