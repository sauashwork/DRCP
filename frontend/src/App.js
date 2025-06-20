import React, { useState, useEffect } from 'react';
import './App.css';
import logo from './logo.svg'; // Place your logo in src/
import io from 'socket.io-client';

// const API = 'http://localhost:5000';
// const socket = io(API);

// added to use backend deployed url 
const API = process.env.REACT_APP_BACKEND_URL;
const socket = io(API, {
  transports: ['polling', 'websocket'],
  upgrade: true,
  withCredentials: true
});


function App() {
  // Auth state
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Login/Register
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [authMsg, setAuthMsg] = useState('');

  // Disasters
  const [disasters, setDisasters] = useState([]);
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [disasterMsg, setDisasterMsg] = useState('');

  // Resources
  const [resourceName, setResourceName] = useState('');
  const [resourceLocation, setResourceLocation] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [resourceLat, setResourceLat] = useState('');
  const [resourceLon, setResourceLon] = useState('');
  const [resourceDisasterId, setResourceDisasterId] = useState('');
  const [resourceMsg, setResourceMsg] = useState('');

  // New state for finding resources
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [radius, setRadius] = useState('');
  const [resources, setResources] = useState([]);
  const [error, setError] = useState('');

  // Image verification
  const [verifyDisasterId, setVerifyDisasterId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [verifyResult, setVerifyResult] = useState('');

  // Social Media
  const [socialDisasterId, setSocialDisasterId] = useState('');
  const [socialPosts, setSocialPosts] = useState([]);
  const [socialMsg, setSocialMsg] = useState('');

  // Official Updates
  const [updatesDisasterId, setUpdatesDisasterId] = useState('');
  const [officialUpdates, setOfficialUpdates] = useState([]);
  const [updatesMsg, setUpdatesMsg] = useState('');

  // Reports
  const [reportDisasterId, setReportDisasterId] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportImageUrl, setReportImageUrl] = useState('');
  const [reports, setReports] = useState([]);
  const [reportMsg, setReportMsg] = useState('');

  // Block all actions if not logged in
  const isLoggedIn = !!token;

  // Fetch disasters
  useEffect(() => {
    if (isLoggedIn) {
      fetch(`${API}/disasters`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setDisasters(Array.isArray(data) ? data : []));
    }
  }, [isLoggedIn, token]);

  // Fetch resources for selected disaster
  useEffect(() => {
    if (isLoggedIn && resourceDisasterId) {
      fetch(`${API}/resources?disaster_id=${resourceDisasterId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setResources(Array.isArray(data) ? data : []));
    }
  }, [isLoggedIn, resourceDisasterId, token]);

  // Real-time updates (Socket.IO)
  useEffect(() => {
    if (!isLoggedIn) return;
    socket.on('disaster_updated', () => {
      fetch(`${API}/disasters`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setDisasters(Array.isArray(data) ? data : []));
    });
    socket.on('resources_updated', () => {
      if (resourceDisasterId) {
        fetch(`${API}/resources?disaster_id=${resourceDisasterId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => setResources(Array.isArray(data) ? data : []));
      }
    });
    socket.on('social_media_updated', () => {
      if (socialDisasterId) handleFetchSocialMedia();
    });
    return () => {
      socket.off('disaster_updated');
      socket.off('resources_updated');
      socket.off('social_media_updated');
    };
    // eslint-disable-next-line
  }, [isLoggedIn, token, resourceDisasterId, socialDisasterId]);

  // Auth handlers
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthMsg('Registering...');
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role: role || undefined })
    });
    const data = await res.json();
    if (res.ok) {
      setAuthMsg('Registered! Now login.');
    } else if (data.errors) {
      setAuthMsg(data.errors.map(e => e.msg).join(', '));
    } else {
      setAuthMsg(data.error || 'Registration failed');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthMsg('Logging in...');
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.token) {
      setToken(data.token);
      setUser({ username: data.username, role: data.role });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ username: data.username, role: data.role }));
      setShowLogin(false);
      setAuthMsg('');
    } else {
      setAuthMsg(data.error || 'Login failed');
    }
  };

  // Disaster handlers
  const handleCreateDisaster = async (e) => {
    e.preventDefault();
    setDisasterMsg('Creating...');
    const res = await fetch(`${API}/disasters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        location_name: locationName,
        description,
        tags: tags.split(',').map(t => t.trim())
      })
    });
    const data = await res.json();
    setDisasterMsg(data.error ? data.error : 'Disaster created!');
    if (!data.error) {
      setDisasters([...disasters, data]);
      setTitle(''); setLocationName(''); setDescription(''); setTags('');
    }
  };

  // Resource handlers
  const handleCreateResource = async (e) => {
    e.preventDefault();
    setResourceMsg('Creating...');
    const res = await fetch(`${API}/resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        disaster_id: resourceDisasterId,
        name: resourceName,
        location_name: resourceLocation,
        type: resourceType,
        lat: resourceLat,
        lon: resourceLon
      })
    });
    const data = await res.json();
    if (data.error) {
      setResourceMsg(data.error);
    } else {
      setResourceMsg('Resource created!');
      setResources([...resources, data]);
      setResourceName('');
      setResourceLocation('');
      setResourceType('');
      setResourceLat('');
      setResourceLon('');
      // Optionally clear the message after 2 seconds
      setTimeout(() => setResourceMsg(''), 2000);
    }
  };

  // Image verification handler
  const handleVerifyImage = async (e) => {
    e.preventDefault();
    setVerifyResult('Verifying...');
    const res = await fetch(`${API}/disasters/${verifyDisasterId}/verify-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ image_url: imageUrl })
    });
    const data = await res.json();
    if (data.error) {
      setVerifyResult("❌ " + data.error);
    } else {
      setVerifyResult(data.verification || "No result");
    }
  };

  // Social media handler
  const handleFetchSocialMedia = async (e) => {
    if (e) e.preventDefault();
    setSocialMsg('Fetching...');
    const res = await fetch(`${API}/disasters/${socialDisasterId}/social-media`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setSocialPosts(Array.isArray(data) ? data : []);
    setSocialMsg('');
  };

  // Official updates handler
  const handleFetchUpdates = async (e) => {
    if (e) e.preventDefault();
    setUpdatesMsg('Fetching...');
    const res = await fetch(`${API}/disasters/${updatesDisasterId}/official-updates`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setOfficialUpdates(Array.isArray(data) ? data : []);
    setUpdatesMsg('');
  };

  // Find nearby resources
  const handleFindResources = async () => {
    setError('');
    setResources([]);
    try {
      const res = await fetch(
        `${API}/resources?lat=${lat}&lon=${lon}&radius=${radius}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResources(data.resources || []);
    } catch (e) {
      setError('Failed to fetch resources');
    }
  };

  // Logout
  const handleLogout = () => {
    setToken('');
    setUser(null);
    setDisasters([]);
    setResources([]);
    setSocialPosts([]);
    setOfficialUpdates([]);
    setUsername('');
    setPassword('');
    setRole('');
    setTitle('');
    setLocationName('');
    setDescription('');
    setTags('');
    setResourceName('');
    setResourceLocation('');
    setResourceType('');
    setResourceLat('');
    setResourceLon('');
    setResourceDisasterId('');
    setLat('');
    setLon('');
    setRadius('');
    setVerifyDisasterId('');
    setImageUrl('');
    setVerifyResult('');
    setSocialDisasterId('');
    setSocialMsg('');
    setUpdatesDisasterId('');
    setUpdatesMsg('');
    setReportDisasterId('');
    setReportContent('');
    setReportImageUrl('');
    setReports([]);
    setReportMsg('');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Add to your state
  const [editingDisaster, setEditingDisaster] = useState(null);
  const [editingResource, setEditingResource] = useState(null);
  const [editingReport, setEditingReport] = useState(null);

  // Edit handler
  const handleEditDisaster = (disaster) => {
    setEditingDisaster(disaster);
    setTitle(disaster.title);
    setLocationName(disaster.location_name);
    setDescription(disaster.description);

    // Fix: handle tags as array or stringified array
    let tagsValue = '';
    if (Array.isArray(disaster.tags)) {
      tagsValue = disaster.tags.join(', ');
    } else if (typeof disaster.tags === 'string') {
      try {
        const parsed = JSON.parse(disaster.tags);
        tagsValue = Array.isArray(parsed) ? parsed.join(', ') : disaster.tags;
      } catch {
        tagsValue = disaster.tags;
      }
    }
    setTags(tagsValue);
  };

  // Update handler
  const handleUpdateDisaster = async (e) => {
    e.preventDefault();
    if (!editingDisaster) return;
    setDisasterMsg('Updating...');
    const res = await fetch(`${API}/disasters/${editingDisaster.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        location_name: locationName,
        description,
        tags: tags.split(',').map(t => t.trim())
      })
    });
    const data = await res.json();
    setDisasterMsg(data.error ? data.error : 'Disaster updated!');
    if (!data.error) {
      setDisasters(disasters.map(d => d.id === data.id ? data : d));
      setEditingDisaster(null);
      setTitle(''); setLocationName(''); setDescription(''); setTags('');
    }
  };

  // Delete handler
  const handleDeleteDisaster = async (id) => {
    if (!window.confirm('Are you sure you want to delete this disaster?')) return;
    const res = await fetch(`${API}/disasters/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.error) setDisasters(disasters.filter(d => d.id !== id));
    setDisasterMsg(data.error ? data.error : 'Disaster deleted!');
  };

  // Resource edit handlers
  const handleEditResource = (resource) => {
    setEditingResource(resource);
    setResourceDisasterId(resource.disaster_id);
    setResourceName(resource.name);
    setResourceLocation(resource.location_name);
    setResourceType(resource.type);
    setResourceLat(resource.lat || (resource.location?.coordinates?.[1] ?? ''));
    setResourceLon(resource.lon || (resource.location?.coordinates?.[0] ?? ''));
  };

  const handleUpdateResource = async (e) => {
    e.preventDefault();
    if (!editingResource) return;
    setResourceMsg('Updating...');
    const res = await fetch(`${API}/resources/${editingResource.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        disaster_id: resourceDisasterId,
        name: resourceName,
        location_name: resourceLocation,
        type: resourceType,
        lat: resourceLat,
        lon: resourceLon
      })
    });
    const data = await res.json();
    setResourceMsg(data.error ? data.error : 'Resource updated!');
    if (!data.error) {
      setResources(resources.map(r => r.id === data.id ? data : r));
      setEditingResource(null);
      setResourceDisasterId('');
      setResourceName('');
      setResourceLocation('');
      setResourceType('');
      setResourceLat('');
      setResourceLon('');
    }
  };

  // Delete resource handler
  const handleDeleteResource = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    const res = await fetch(`${API}/resources/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.error) setResources(resources.filter(r => r.id !== id));
    setResourceMsg(data.error ? data.error : 'Resource deleted!');
  };

  // Report handlers
  const handleCreateReport = async (e) => {
    e.preventDefault();
    setReportMsg('Submitting...');
    const res = await fetch(`${API}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        disaster_id: reportDisasterId,
        content: reportContent,
        image_url: reportImageUrl
      })
    });
    const data = await res.json();
    if (data.error) {
      setReportMsg(data.error);
    } else {
      setReportMsg('Report submitted!');
      setReports([...reports, data]);
      setReportContent('');
      setReportImageUrl('');
      // Optionally clear message after 2s
      setTimeout(() => setReportMsg(''), 2000);
    }
  };

  const handleFetchReports = async (disasterId) => {
    setReportMsg('Loading...');
    const res = await fetch(`${API}/reports/${disasterId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setReports(Array.isArray(data) ? data : []);
    setReportMsg('');
  };

  // Edit report handler
  const handleEditReport = (report) => {
    setEditingReport(report);
    setReportDisasterId(report.disaster_id);
    setReportContent(report.content);
    setReportImageUrl(report.image_url);
  };

  // Update report handler
  const handleUpdateReport = async (e) => {
    e.preventDefault();
    if (!editingReport) return;
    setReportMsg('Updating...');
    const res = await fetch(`${API}/reports/${editingReport.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        disaster_id: reportDisasterId,
        content: reportContent,
        image_url: reportImageUrl
      })
    });
    const data = await res.json();
    setReportMsg(data.error ? data.error : 'Report updated!');
    if (!data.error) {
      setReports(reports.map(r => r.id === data.id ? data : r));
      setEditingReport(null);
      setReportContent('');
      setReportImageUrl('');
    }
  };

  // Delete report handler
  const handleDeleteReport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    const res = await fetch(`${API}/reports/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.error) setReports(reports.filter(r => r.id !== id));
    setReportMsg(data.error ? data.error : 'Report deleted!');
  };

  useEffect(() => {
    if (reportDisasterId) {
      handleFetchReports(reportDisasterId);
    }
    // eslint-disable-next-line
  }, [reportDisasterId]);

  // Restore token and user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) setToken(savedToken);

    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setDarkMode(savedTheme === 'dark');
    else setDarkMode(false);
  }, []);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      localStorage.setItem('theme', !prev ? 'dark' : 'light');
      return !prev;
    });
  };

  return (
    <div className={`main-bg${darkMode ? ' dark' : ' light'}`}>
      <div className="header">
        <img src={logo} alt="Logo" className="logo" />
        <h1>Disaster Response Coordination Platform</h1>
        <div className="header-actions">
          {!isLoggedIn ? (
            <>
              <button onClick={() => setShowLogin(true)}>Login</button>
              <button onClick={() => setShowRegister(true)}>Register</button>
            </>
          ) : (
            <button onClick={handleLogout}>Logout</button>
          )}
          <button className="toggle-btn" onClick={toggleTheme}>
            {darkMode ? '💡' : '🌚'}
          </button>
        </div>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="modal">
          <div>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
              <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="submit">Login</button>
            </form>
            <div className="msg">{authMsg}</div>
            <button onClick={() => setShowLogin(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <div className="modal">
          <div>
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
              <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
              <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              <input placeholder="Role (admin/citizen/volunteer)" value={role} onChange={e => setRole(e.target.value)} />
              <button type="submit">Register</button>
              <div style={{ fontSize: '0.9em', color: '#555', marginTop: 8 }}>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Username must be at least 3 characters.</li>
                  <li>Password must be at least 6 characters.</li>
                  <li>Role must be one of the following: admin, citizen, volunteer.</li>
                </ul>
              </div>
            </form>
            <div className="msg">{authMsg}</div>
            <button onClick={() => setShowRegister(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="main-grid">
        {/* Top Row */}
        <div className="card disaster-card">
          <h2>Disaster Management</h2>
          {!isLoggedIn ? (
            <div className="blocked">Please login to access features.</div>
          ) : (
            <>
              <form onSubmit={editingDisaster ? handleUpdateDisaster : handleCreateDisaster}>
                <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
                <input placeholder="Location Name" value={locationName} onChange={e => setLocationName(e.target.value)} />
                <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
                <input placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} />
                <button type="submit">{editingDisaster ? 'Update Disaster' : 'Create Disaster'}</button>
                {editingDisaster && <button type="button" onClick={() => setEditingDisaster(null)}>Cancel</button>}
              </form>
              <div className="msg">{disasterMsg}</div>
              <h3>Disasters</h3>
              <ul>
                {Array.isArray(disasters) && disasters.length > 0 ? disasters.map(d => (
                  <li key={d.id}>
                    <b>{d.title}</b> ({d.location_name})<br />
                    {d.description}<br />
                    Tags: {Array.isArray(d.tags) ? d.tags.join(', ') : d.tags}<br />
                    ID: {d.id}
                    {user?.role === 'admin' && (
                      <>
                        <button onClick={() => handleEditDisaster(d)}>Edit</button>
                        <button onClick={() => handleDeleteDisaster(d.id)}>Delete</button>
                      </>
                    )}
                  </li>
                )) : <li>No disasters found.</li>}
              </ul>
            </>
          )}
        </div>
        <div className="card resource-card">
          <h2>Resource Management</h2>
          {!isLoggedIn ? (
            <div className="blocked">Please login to access features.</div>
          ) : (
            <>
              {/* Resource creation */}
              {user?.role === 'admin' && (
                <form onSubmit={editingResource ? handleUpdateResource : handleCreateResource}>
                  <input placeholder="Disaster ID" value={resourceDisasterId} onChange={e => setResourceDisasterId(e.target.value)} />
                  <input placeholder="Name" value={resourceName} onChange={e => setResourceName(e.target.value)} />
                  <input placeholder="Location Name" value={resourceLocation} onChange={e => setResourceLocation(e.target.value)} />
                  <input placeholder="Type (shelter, hospital, etc.)" value={resourceType} onChange={e => setResourceType(e.target.value)} />
                  <input placeholder="Latitude" value={resourceLat} onChange={e => setResourceLat(e.target.value)} />
                  <input placeholder="Longitude" value={resourceLon} onChange={e => setResourceLon(e.target.value)} />
                  <button type="submit">{editingResource ? 'Update Resource' : 'Create Resource'}</button>
                  {editingResource && <button type="button" onClick={() => setEditingResource(null)}>Cancel</button>}
                </form>
              )}
              <div className="msg">{resourceMsg}</div>
              <h3>Resources</h3>
              <ul>
                {resources.map(r => (
                  <li key={r.id}>
                    <b>{r.name}</b> ({r.location_name}) - {r.type}
                    <br />
                    lat/lon: {r.location}
                    {user?.role === 'admin' && (
                      <>
                        <button onClick={() => handleEditResource(r)}>Edit</button>
                        <button onClick={() => handleDeleteResource(r.id)}>Delete</button>
                      </>
                    )}
                  </li>
                ))}
              </ul>

              {/* Find Nearby Resources */}
              <h3>Find Nearby Resources</h3>
              <div className="resource-row-fields">
                <input
                  placeholder="Latitude"
                  value={lat}
                  onChange={e => setLat(e.target.value)}
                />
                <input
                  placeholder="Longitude"
                  value={lon}
                  onChange={e => setLon(e.target.value)}
                />
                <input
                  placeholder="Enter radius in meters"
                  value={radius}
                  onChange={e => setRadius(e.target.value)}
                />
              </div>
              <button onClick={handleFindResources}>Find Nearby Resources</button>
              {error && <div style={{ color: 'red' }}>{error}</div>}
              <ul>
                {resources.map(r => (
                  <li key={r.id}>
                    <b>{r.name}</b> ({r.type}) - {r.location_name}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Middle Row */}
        <div className="card image-card">
          <h2>Image Verification</h2>
          {!isLoggedIn ? (
            <div className="blocked">Please login to access features.</div>
          ) : (
            <>
              <form onSubmit={handleVerifyImage}>
                <input placeholder="Disaster ID" value={verifyDisasterId} onChange={e => setVerifyDisasterId(e.target.value)} />
                <input placeholder="Image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
                <button type="submit">Verify Image</button>
              </form>
              <pre>{verifyResult}</pre>
            </>
          )}
        </div>

        {/* Bottom Row */}
        <div className="card social-card">
          <h2>Social Media Reports</h2>
          {!isLoggedIn ? (
            <div className="blocked">Please login to access features.</div>
          ) : (
            <>
              <form onSubmit={handleFetchSocialMedia}>
                <input placeholder="Disaster ID" value={socialDisasterId} onChange={e => setSocialDisasterId(e.target.value)} />
                <button type="submit">Fetch Social Media</button>
              </form>
              <div className="msg">{socialMsg}</div>
              <ul>
                {Array.isArray(socialPosts) && socialPosts.length > 0 ? socialPosts.map((p, i) => (
                  <li key={i}>
                    <b>{p.user}</b>: {p.post}
                  </li>
                )) : <li>No social media reports.</li>}
              </ul>
            </>
          )}
        </div>
        <div className="card updates-card">
          <h2>Official Updates</h2>
          {!isLoggedIn ? (
            <div className="blocked">Please login to access features.</div>
          ) : (
            <>
              <form onSubmit={handleFetchUpdates}>
                <input placeholder="Disaster ID" value={updatesDisasterId} onChange={e => setUpdatesDisasterId(e.target.value)} />
                <button type="submit">Fetch Updates</button>
              </form>
              <div className="msg">{updatesMsg}</div>
              <ul>
                {Array.isArray(officialUpdates) && officialUpdates.length > 0 ? officialUpdates.map((u, i) => (
                  <li key={i}>
                    <b>{u.title}</b> <a href={u.link} target="_blank" rel="noopener noreferrer">[link]</a><br />
                    {u.date}
                  </li>
                )) : <li>No official updates.</li>}
              </ul>
            </>
          )}
        </div>

        {/* Reports Section */}
        <div className="card report-card">
          <h2>Submit a Report</h2>
          <form onSubmit={editingReport ? handleUpdateReport : handleCreateReport}>
            <input
              placeholder="Disaster ID"
              value={reportDisasterId}
              onChange={e => setReportDisasterId(e.target.value)}
            />
            <input
              placeholder="Content"
              value={reportContent}
              onChange={e => setReportContent(e.target.value)}
            />
            <input
              placeholder="Image URL"
              value={reportImageUrl}
              onChange={e => setReportImageUrl(e.target.value)}
            />
            <button type="submit">{editingReport ? 'Update Report' : 'Submit Report'}</button>
            {editingReport && (
              <button type="button" onClick={() => setEditingReport(null)}>
                Cancel
              </button>
            )}
          </form>
          <div className="msg">{reportMsg}</div>

          <h3>Reports</h3>
          <button onClick={() => handleFetchReports(reportDisasterId)}>
            Load Reports for Disaster
          </button>
          <ul>
            {reports.map(r => (
              <li key={r.id}>
                <b>{r.users?.username || 'Anonymous'}</b>: {r.content}
                {r.image_url && (
                  <img
                    src={r.image_url}
                    alt="report"
                    style={{ maxWidth: "100%", maxHeight: "250px", display: "block", margin: "10px 0" }}
                  />
                )}
                <div style={{ whiteSpace: "pre-line" }}>
                  <b>Status:</b> {r.verification_status}
                </div>
                {/* ...admin controls... */}
              </li>
            ))}
          </ul>
        </div>

      </div>

      <footer className="footer">
        Designed and developed by Saumya Raj
      </footer>
    </div>
  );
}

export default App;