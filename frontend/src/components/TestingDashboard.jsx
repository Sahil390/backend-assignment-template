import React, { useState } from 'react';

export default function TestingDashboard() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  
  const [email, setEmail] = useState('aarav@example.com');
  const [password, setPassword] = useState('Candidate123!');
  
  const [programs, setPrograms] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [applications, setApplications] = useState([]);
  
  const API_BASE = 'http://localhost:4000/api';

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success || data.status === 'success') {
        setToken(data.data.token);
        setUser(data.data.user);
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      alert("Network Error: Make sure backend is running on 4000");
    }
  };

  const loadPrograms = async () => {
    try {
      const res = await fetch(`${API_BASE}/programs`);
      const data = await res.json();
      setPrograms(data.data || []);
    } catch (err) {
      alert("Network Error: " + err.message);
    }
  };

  const loadRecommendations = async () => {
    if (!user) return alert("Please login first to identify student.");
    try {
      const res = await fetch(`${API_BASE}/recommendations/${user._id}`);
      const data = await res.json();
      if (data.data?.recommendations) {
        setRecommendations(data.data.recommendations);
      }
    } catch (err) {
      alert("Network Error: " + err.message);
    }
  };

  const loadApplications = async () => {
    try {
      const res = await fetch(`${API_BASE}/applications`);
      const data = await res.json();
      setApplications(data.data || []);
    } catch (err) {
      alert("Network Error: " + err.message);
    }
  };

  const applyToProgram = async (programId) => {
    if (!user || !token) return alert("Please login first before applying!");
    try {
      const res = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: user._id,
          programId,
          intake: 'Fall 2025' // Defaulting to Fall 2025 for simulation
        })
      });
      const data = await res.json();
      
      if (res.ok && (data.success || data.status === 'success')) {
        alert("Application Created Successfully!");
        loadApplications(); // Refresh list automatically
      } else {
        alert(data.message || 'Application failed. (Check if duplicate)');
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const dashboardStyle = {
    padding: '2rem',
    background: '#ffffff',
    color: '#333333',
    fontFamily: 'system-ui, sans-serif',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    maxWidth: '1000px',
    margin: '2rem auto'
  };

  const sectionStyle = {
    border: '1px solid #eaeaea',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    background: '#fafafa'
  };

  return (
    <div style={dashboardStyle}>
      <h1 style={{borderBottom: '2px solid #eaeaea', paddingBottom: '1rem'}}>🧪 Interactive API Testing Dashboard</h1>
      <p style={{marginBottom: '2rem', color: '#666'}}>Use this console to execute the exact workflows you built in the backend directly.</p>
      
      {/* AUTH SECTION */}
      <section style={sectionStyle}>
        <h2>1. Authentication flow</h2>
        <p>Login to establish your Bearer JWT locally for testing.</p>
        {!user ? (
          <form onSubmit={handleLogin} style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" style={{padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}} />
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" style={{padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}} />
            <button type="submit" style={{padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Login</button>
          </form>
        ) : (
          <div>
            <div style={{background: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '4px'}}>
              <strong>Active Session:</strong> {user.fullName} ({user.email}) - {user.role}
            </div>
            <p style={{wordBreak: 'break-all', fontSize: '12px', marginTop: '10px', color: '#888'}}>
              <strong>Decoded Token:</strong> {token}
            </p>
          </div>
        )}
      </section>

      {/* DISCOVERY SECTION */}
      <section style={sectionStyle}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h2>2. Program Discovery</h2>
            <p>Querying <code>/api/programs</code> with pagination & sorting.</p>
          </div>
          <button onClick={loadPrograms} style={{padding: '8px 16px', background: '#333', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer'}}>Trigger GET</button>
        </div>
        
        {programs.length > 0 && (
          <div style={{marginTop: '1rem', overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px'}}>
              <thead>
                <tr style={{borderBottom: '2px solid #ccc'}}>
                  <th style={{padding: '8px'}}>Title</th>
                  <th style={{padding: '8px'}}>University</th>
                  <th style={{padding: '8px'}}>Tuition</th>
                  <th style={{padding: '8px'}}>Fast Apply</th>
                </tr>
              </thead>
              <tbody>
                {programs.map(p => (
                  <tr key={p._id} style={{borderBottom: '1px solid #eee'}}>
                    <td style={{padding: '8px'}}>{p.title}</td>
                    <td style={{padding: '8px'}}>{p.universityName}</td>
                    <td style={{padding: '8px'}}>${p.tuitionFeeUsd.toLocaleString()}</td>
                    <td style={{padding: '8px'}}>
                      <button onClick={() => applyToProgram(p._id)} style={{background: '#4caf50', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer'}}>Apply</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* RECOMMENDATIONS SECTION */}
      <section style={sectionStyle}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
             <h2>3. Recommendation Aggregation Engine</h2>
             <p>Querying <code>/api/recommendations/:studentId</code> explicitly for your preferences.</p>
          </div>
          <button onClick={loadRecommendations} disabled={!user} style={{padding: '8px 16px', background: user ? '#333' : '#ccc', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer'}}>Load My Pipeline</button>
        </div>
        
        {recommendations.length > 0 && (
          <ul style={{marginTop: '1rem', paddingLeft: '0', listStyle: 'none'}}>
            {recommendations.map(r => (
              <li key={r._id} style={{background: '#e3f2fd', padding: '10px', borderRadius: '6px', marginBottom: '8px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <strong>{r.title}</strong>
                  <span style={{background: '#2196f3', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px'}}>Score: {r.matchScore} pts</span>
                </div>
                <div style={{fontSize: '12px', color: '#555', marginTop: '6px'}}>{JSON.stringify(r.reasons)}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* APPLICATIONS SECTION */}
      <section style={sectionStyle}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
           <div>
             <h2>4. Applications State Tracking</h2>
             <p>Fetching all applied programs from <code>/api/applications</code>.</p>
           </div>
           <button onClick={loadApplications} style={{padding: '8px 16px', background: '#333', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer'}}>Sync State</button>
        </div>
        
        {applications.length > 0 && (
          <div style={{marginTop: '1rem'}}>
             {applications.map(a => (
               <div key={a._id} style={{padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between'}}>
                 <div>
                   <strong>{a.program?.title}</strong> at {a.university?.name} <br/>
                   <small style={{color: '#666'}}>Target Intake: {a.intake}</small>
                 </div>
                 <div style={{textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', background: '#ffeb3b', padding: '4px 8px', borderRadius: '4px', alignSelf: 'flex-start'}}>
                   {a.status}
                 </div>
               </div>
             ))}
          </div>
        )}
      </section>
    </div>
  );
}
