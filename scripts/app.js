(function () {
  'use strict';

  const API_URL  = 'https://api.openligadb.de/getmatchdata/wm26/2026';
  const FALLBACK = 'data/openligadb-wm26-2026.json';

  // How many stage groups to show before the "More" button
  const INITIAL_STAGES = 3;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function getScore(match) {
    let ft = null, ht = null;
    for (const r of match.matchResults || []) {
      if (r.resultTypeID === 2) ft = [r.pointsTeam1, r.pointsTeam2];
      if (r.resultTypeID === 1) ht = [r.pointsTeam1, r.pointsTeam2];
    }
    return { ft, ht };
  }

  function getStatus(match) {
    if (match.matchIsFinished) return 'finished';
    if ((match.matchResults || []).length > 0) return 'live';
    return 'upcoming';
  }

  function fmtTime(isoUTC) {
    const d = new Date(isoUTC.endsWith('Z') ? isoUTC : isoUTC + 'Z');
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function fmtDate(isoUTC) {
    const d = new Date(isoUTC.endsWith('Z') ? isoUTC : isoUTC + 'Z');
    return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function groupLabel(match) {
    const name = (match.group && match.group.groupName) || '';
    if (/Gruppenphase\s*1/i.test(name)) return 'Group Stage — Matchday 1';
    if (/Gruppenphase\s*2/i.test(name)) return 'Group Stage — Matchday 2';
    if (/Gruppenphase\s*3/i.test(name)) return 'Group Stage — Matchday 3';
    if (/Achtelfinale/i.test(name))     return 'Round of 16';
    if (/Viertelfinale/i.test(name))    return 'Quarter-finals';
    if (/Halbfinale/i.test(name))       return 'Semi-finals';
    if (/Finale/i.test(name))           return 'Final';
    return name || 'Other';
  }

  function stageOrder(match) {
    return (match.group && match.group.groupOrderID) || 99;
  }

  // ── Flag image ────────────────────────────────────────────────────────────

  function flagImg(team) {
    const short = (team.shortName || '??').slice(0, 3).toUpperCase();
    if (team.teamIconUrl) {
      return `<img class="team-flag" src="${team.teamIconUrl}"
        alt="${short}" title="${team.teamName}"
        onerror="this.outerHTML=\`<span class='flag-fallback'>${short}</span>\`">`;
    }
    return `<span class="flag-fallback">${short}</span>`;
  }

  // ── Match card ────────────────────────────────────────────────────────────

  function matchCard(match) {
    const { ft, ht } = getScore(match);
    const status     = getStatus(match);

    let badge = '';
    if (status === 'finished') {
      badge = `<span class="status-badge badge-ft">FT</span>`;
    } else if (status === 'live') {
      badge = `<span class="status-badge badge-live">● Live</span>`;
    } else {
      badge = `<span class="status-badge badge-soon">vs</span>`;
    }

    let center = '';
    if (status === 'finished' || status === 'live') {
      const s = ft || [0, 0];
      center = `
        <div class="score-col">
          <div class="score-box">
            <span>${s[0]}</span><span class="score-sep">:</span><span>${s[1]}</span>
          </div>
          ${badge}
          ${ht ? `<div class="ht-score">HT ${ht[0]}–${ht[1]}</div>` : ''}
        </div>`;
    } else {
      const dt = match.matchDateTimeUTC || match.matchDateTime;
      center = `
        <div class="score-col">
          <div class="kickoff-time">${fmtTime(dt)}</div>
          <div class="kickoff-date">${fmtDate(dt)}</div>
          ${badge}
        </div>`;
    }

    let goalsRow = '';
    if ((status === 'finished' || status === 'live') && (match.goals || []).length > 0) {
      const byT1 = [], byT2 = [];
      let prev = 0;
      for (const g of match.goals) {
        const suffix = g.isOwnGoal ? ' (og)' : g.isPenalty ? ' (pen)' : '';
        const lbl = `${g.goalGetterName || '?'}${suffix} <span class="minute">${g.matchMinute}'</span>`;
        if (g.scoreTeam1 > prev) byT1.push(lbl); else byT2.push(lbl);
        prev = g.scoreTeam1;
      }
      goalsRow = `
        <div class="goals-row">
          <div class="goals-team goals-t1">${byT1.map(g => `<div class="goal-item">${g}</div>`).join('')}</div>
          <div class="goals-team goals-t2">${byT2.map(g => `<div class="goal-item">${g}</div>`).join('')}</div>
        </div>`;
    }

    const venue = match.location
      ? `${match.location.locationCity}${match.location.locationStadium ? ' · ' + match.location.locationStadium : ''}`
      : '';

    return `
      <div class="match-card is-${status}">
        <div class="match-meta">
          <span class="venue-text">${venue}</span>
        </div>
        <div class="match-body">
          <div class="team team1">
            ${flagImg(match.team1)}
            <span class="team-name">${match.team1.teamName}</span>
            <span class="team-short">${match.team1.shortName || match.team1.teamName}</span>
          </div>
          ${center}
          <div class="team team2">
            ${flagImg(match.team2)}
            <span class="team-name">${match.team2.teamName}</span>
            <span class="team-short">${match.team2.shortName || match.team2.teamName}</span>
          </div>
        </div>
        ${goalsRow}
      </div>`;
  }

  // ── Build sorted stage map ────────────────────────────────────────────────

  function buildStages(matches) {
    const sorted = [...matches].sort((a, b) => {
      const d = stageOrder(a) - stageOrder(b);
      if (d !== 0) return d;
      return new Date(a.matchDateTimeUTC || a.matchDateTime) -
             new Date(b.matchDateTimeUTC || b.matchDateTime);
    });
    const map = new Map();
    for (const m of sorted) {
      const key = `${stageOrder(m)}__${groupLabel(m)}`;
      if (!map.has(key)) map.set(key, { label: groupLabel(m), matches: [] });
      map.get(key).matches.push(m);
    }
    return [...map.values()];
  }

  function stageHtml(stage) {
    return `
      <div class="stage">
        <div class="stage-header">
          <span class="stage-title">${stage.label}</span>
          <span class="stage-divider"></span>
          <span class="stage-count">${stage.matches.length} match${stage.matches.length !== 1 ? 'es' : ''}</span>
        </div>
        ${stage.matches.map(matchCard).join('')}
      </div>`;
  }

  // ── Render: Matches tab ───────────────────────────────────────────────────

  function renderMatches(matches) {
    const stages = buildStages(matches);
    const panel  = document.getElementById('tab-matches');

    if (stages.length === 0) {
      panel.innerHTML = `<p style="color:var(--sub);text-align:center;padding:40px">No matches found.</p>`;
      return;
    }

    const visible = stages.slice(0, INITIAL_STAGES);
    const hidden  = stages.slice(INITIAL_STAGES);
    const hasMore = hidden.length > 0;

    let html = visible.map(stageHtml).join('');

    if (hasMore) {
      html += `<div class="more-wrap"><button id="more-btn">Show ${hidden.length} more group${hidden.length !== 1 ? 's' : ''}</button></div>`;
    }

    panel.innerHTML = html;

    if (hasMore) {
      document.getElementById('more-btn').addEventListener('click', () => {
        const btn  = document.getElementById('more-btn');
        const wrap = btn.parentElement;
        wrap.insertAdjacentHTML('beforebegin', hidden.map(stageHtml).join(''));
        wrap.remove();
      });
    }
  }

  // ── Render: Overview tab ──────────────────────────────────────────────────

  function renderOverview(matches) {
    const panel = document.getElementById('tab-overview');

    const live     = matches.filter(m => getStatus(m) === 'live');
    const finished = matches.filter(m => getStatus(m) === 'finished')
                            .sort((a, b) => new Date(b.matchDateTimeUTC || b.matchDateTime) -
                                            new Date(a.matchDateTimeUTC || a.matchDateTime))
                            .slice(0, 5);
    const upcoming = matches.filter(m => getStatus(m) === 'upcoming')
                            .sort((a, b) => new Date(a.matchDateTimeUTC || a.matchDateTime) -
                                            new Date(b.matchDateTimeUTC || b.matchDateTime))
                            .slice(0, 5);

    function section(title, ms) {
      if (!ms.length) return '';
      return `
        <div class="stage">
          <div class="stage-header">
            <span class="stage-title">${title}</span>
            <span class="stage-divider"></span>
          </div>
          ${ms.map(matchCard).join('')}
        </div>`;
    }

    const html = section('🔴 Live Now', live) +
                 section('Recent Results', finished) +
                 section('Upcoming Fixtures', upcoming);

    panel.innerHTML = html ||
      `<div class="placeholder-card">
        <div class="placeholder-icon">📅</div>
        <div class="placeholder-title">No matches right now</div>
        <div class="placeholder-sub">Check the Matches tab for the full schedule.</div>
       </div>`;
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  function setStatus(msg, isError) {
    const el = document.getElementById('status-msg');
    el.style.display = msg ? 'block' : 'none';
    el.className = isError ? 'error' : '';
    el.innerHTML = msg;
  }

  function setBadge(text, cls) {
    const el = document.getElementById('source-badge');
    el.textContent = text;
    el.className = cls;
  }

  function setMeta(text) {
    document.getElementById('last-updated').textContent = text;
  }

  function extractMatches(data) {
    // Live API returns a raw array; local files return { matches: [...] }
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.matches)) return data.matches;
    return [];
  }

  async function load() {
    const btn = document.getElementById('refresh-btn');
    btn.disabled = true;
    setStatus(`<div class="spinner"></div><br>Loading match data…`, false);
    document.getElementById('tab-matches').innerHTML  = '';
    document.getElementById('tab-overview').innerHTML = '';

    try {
      // 1. Mock override (set by data/openligadb-wm26-2026.mock.js)
      if (window.__OPENLIGADB_WM26_MOCK__) {
        const matches = extractMatches(window.__OPENLIGADB_WM26_MOCK__);
        renderOverview(matches);
        renderMatches(matches);
        setBadge('Mock data', 'fallback');
        setStatus('', false);
        setMeta(`Mock data · ${matches.length} matches`);
        btn.disabled = false;
        return;
      }

      // 2. Live API
      let matches = null;
      try {
        const resp = await fetch(API_URL, { cache: 'no-store' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        matches = extractMatches(data);
        setBadge('Live', 'live');
        setMeta(`Live data · ${matches.length} matches · ${new Date().toLocaleTimeString()}`);
      } catch (liveErr) {
        console.warn('Live API failed, using local fallback:', liveErr.message);
        // 3. Local JSON fallback
        const resp2 = await fetch(FALLBACK, { cache: 'no-store' });
        if (!resp2.ok) throw new Error(`Fallback HTTP ${resp2.status}`);
        const data2 = await resp2.json();
        matches = extractMatches(data2);
        setBadge('Local fallback', 'fallback');
        setMeta(`Local fallback · ${matches.length} matches`);
      }

      renderOverview(matches);
      renderMatches(matches);
      setStatus('', false);

    } catch (err) {
      setStatus(`⚠ Could not load match data.<br><small>${err.message}</small>`, true);
      setBadge('Error', '');
      setMeta('');
    } finally {
      btn.disabled = false;
    }
  }

  // ── Tab switching ─────────────────────────────────────────────────────────

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  // ── Init ──────────────────────────────────────────────────────────────────

  document.getElementById('refresh-btn').addEventListener('click', load);
  load();
})();
