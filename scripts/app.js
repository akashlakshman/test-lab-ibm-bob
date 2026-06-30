(function () {
  'use strict';

  const API_URL  = 'https://api.openligadb.de/getmatchdata/wm26/2026';
  // FALLBACK path is relative to the HTML page; pages/ is one level deeper than root
  const FALLBACK = (document.body.dataset.root || '') + 'data/openligadb-wm26-2026.json';

  // Current page name — set via <body data-page="pagename">
  const PAGE = document.body.dataset.page || 'overview';

  // How many stage groups to show before the "More" button (Matches tab)
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

  function flagImg(team, size) {
    // size: 'sm' (default 30×21) or 'xs' (20×14)
    const cls = size === 'xs' ? 'team-flag team-flag-xs' : 'team-flag';
    const short = (team.shortName || '??').slice(0, 3).toUpperCase();
    if (team.teamIconUrl) {
      return `<img class="${cls}" src="${team.teamIconUrl}"
        alt="${short}" title="${team.teamName}"
        onerror="this.outerHTML=\`<span class='flag-fallback flag-fallback-${size||'sm'}'>${short}</span>\`">`;
    }
    return `<span class="flag-fallback flag-fallback-${size||'sm'}">${short}</span>`;
  }

  // ── Match card (full, used in Overview + Matches) ─────────────────────────

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

  // ── Compact match row (used in Overview summary list) ─────────────────────

  function matchRow(match) {
    const { ft } = getScore(match);
    const status = getStatus(match);
    const dt     = match.matchDateTimeUTC || match.matchDateTime;

    let mid = '';
    if (status === 'finished') {
      mid = `<span class="mr-score">${ft[0]} – ${ft[1]}</span><span class="mr-badge mr-ft">FT</span>`;
    } else if (status === 'live') {
      mid = `<span class="mr-score">${(ft||[0,0])[0]} – ${(ft||[0,0])[1]}</span><span class="mr-badge mr-live">● Live</span>`;
    } else {
      mid = `<span class="mr-time">${fmtTime(dt)}</span><span class="mr-date">${fmtDate(dt)}</span>`;
    }

    return `
      <div class="match-row is-${status}">
        <div class="mr-team mr-team1">
          ${flagImg(match.team1, 'xs')}
          <span class="mr-name">${match.team1.shortName || match.team1.teamName}</span>
        </div>
        <div class="mr-center">${mid}</div>
        <div class="mr-team mr-team2">
          <span class="mr-name">${match.team2.shortName || match.team2.teamName}</span>
          ${flagImg(match.team2, 'xs')}
        </div>
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

  // ── Group letter inference (union-find) ───────────────────────────────────
  // Builds a map of teamId → "A"…"L" from group-stage match pairings.

  function inferGroupLetters(matches) {
    const parent = {};
    function find(x) {
      if (parent[x] === x) return x;
      parent[x] = find(parent[x]);
      return parent[x];
    }
    function union(a, b) {
      a = find(a); b = find(b);
      if (a !== b) parent[a] = b;
    }

    // Collect group-stage matches; initialise all nodes
    const gMatches = matches.filter(m => m.group && m.group.groupOrderID <= 3);
    const teamMeta = {};
    for (const m of gMatches) {
      parent[m.team1.teamId] = m.team1.teamId;
      parent[m.team2.teamId] = m.team2.teamId;
      teamMeta[m.team1.teamId] = m.team1;
      teamMeta[m.team2.teamId] = m.team2;
    }
    for (const m of gMatches) union(m.team1.teamId, m.team2.teamId);

    // Gather clusters
    const clusterMap = {};
    for (const id of Object.keys(teamMeta)) {
      const root = find(+id);
      if (!clusterMap[root]) clusterMap[root] = [];
      clusterMap[root].push(+id);
    }
    // Sort clusters by their first alphabetical team name for stable A-L labels
    const clusters = Object.values(clusterMap).sort((a, b) => {
      const na = a.map(id => teamMeta[id].teamName).sort()[0];
      const nb = b.map(id => teamMeta[id].teamName).sort()[0];
      return na.localeCompare(nb);
    });

    const letter = {};
    clusters.forEach((c, i) => c.forEach(id => {
      letter[id] = String.fromCharCode(65 + i);
    }));
    return { letter, teamMeta, clusters };
  }

  // ── Standings calculator ──────────────────────────────────────────────────

  function calcStandings(teamIds, matches, teamMeta) {
    const rows = {};
    for (const id of teamIds) {
      rows[id] = { team: teamMeta[id], p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
    }
    const idSet = new Set(teamIds);
    for (const m of matches) {
      if (!m.matchIsFinished) continue;
      if (!idSet.has(m.team1.teamId) || !idSet.has(m.team2.teamId)) continue;
      const ft = m.matchResults.find(r => r.resultTypeID === 2);
      if (!ft) continue;
      const r1 = rows[m.team1.teamId];
      const r2 = rows[m.team2.teamId];
      r1.p++; r2.p++;
      r1.gf += ft.pointsTeam1; r1.ga += ft.pointsTeam2;
      r2.gf += ft.pointsTeam2; r2.ga += ft.pointsTeam1;
      if      (ft.pointsTeam1 > ft.pointsTeam2) { r1.w++; r2.l++; }
      else if (ft.pointsTeam1 < ft.pointsTeam2) { r2.w++; r1.l++; }
      else                                        { r1.d++; r2.d++; }
    }
    return Object.values(rows)
      .map(r => ({ ...r, gd: r.gf - r.ga, pts: r.w * 3 + r.d }))
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  }

  // ── Render: Overview tab ──────────────────────────────────────────────────

  function renderOverview(matches) {
    const panel    = document.getElementById('tab-overview');
    const total    = matches.length;
    const live     = matches.filter(m => getStatus(m) === 'live');
    const finished = matches.filter(m => getStatus(m) === 'finished');
    const upcoming = matches.filter(m => getStatus(m) === 'upcoming');

    // Summary stat cards
    const stats = `
      <div class="ov-stats">
        <div class="ov-stat">
          <span class="ov-stat-num">${total}</span>
          <span class="ov-stat-lbl">Total Matches</span>
        </div>
        <div class="ov-stat">
          <span class="ov-stat-num ov-num-green">${finished.length}</span>
          <span class="ov-stat-lbl">Played</span>
        </div>
        <div class="ov-stat ${live.length ? 'ov-stat-live' : ''}">
          <span class="ov-stat-num ov-num-red">${live.length}</span>
          <span class="ov-stat-lbl">Live Now</span>
        </div>
        <div class="ov-stat">
          <span class="ov-stat-num">${upcoming.length}</span>
          <span class="ov-stat-lbl">Upcoming</span>
        </div>
      </div>`;

    // Compact match list: live first, then 5 most-recent results, then 5 next upcoming
    const recentFin = [...finished]
      .sort((a, b) => new Date(b.matchDateTimeUTC || b.matchDateTime) -
                      new Date(a.matchDateTimeUTC || a.matchDateTime))
      .slice(0, 5);
    const nextUp = [...upcoming]
      .sort((a, b) => new Date(a.matchDateTimeUTC || a.matchDateTime) -
                      new Date(b.matchDateTimeUTC || b.matchDateTime))
      .slice(0, 5);

    function section(title, ms, extra) {
      if (!ms.length) return '';
      return `
        <div class="stage">
          <div class="stage-header">
            <span class="stage-title">${title}</span>
            <span class="stage-divider"></span>
            ${extra || ''}
          </div>
          <div class="match-row-list">${ms.map(matchRow).join('')}</div>
        </div>`;
    }

    const list = section('🔴 Live Now', live) +
                 section('Recent Results', recentFin) +
                 section('Upcoming Fixtures', nextUp);

    panel.innerHTML = stats + (list || `
      <div class="placeholder-card">
        <div class="placeholder-icon">📅</div>
        <div class="placeholder-title">No matches right now</div>
        <div class="placeholder-sub">Check the Matches tab for the full schedule.</div>
      </div>`);
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

  // ── Render: Table tab ─────────────────────────────────────────────────────

  function renderTable(matches) {
    const panel = document.getElementById('tab-table');
    const { letter, teamMeta, clusters } = inferGroupLetters(matches);

    let html = '';
    clusters.forEach((teamIds, i) => {
      const grpLetter = String.fromCharCode(65 + i);
      const rows = calcStandings(teamIds, matches, teamMeta);
      const anyPlayed = rows.some(r => r.p > 0);

      const trs = rows.map((r, pos) => {
        const qualClass = pos < 2 ? 'row-qualifies' : pos === 2 ? 'row-third' : '';
        const gdStr = r.gd > 0 ? '+' + r.gd : String(r.gd);
        return `
          <tr class="${qualClass}">
            <td class="st-pos">${pos + 1}</td>
            <td class="st-team">
              <div class="st-team-inner">
                ${flagImg(r.team, 'xs')}
                <span class="st-name">${r.team.teamName}</span>
                <span class="st-short">${r.team.shortName || ''}</span>
              </div>
            </td>
            <td>${r.p}</td>
            <td>${r.w}</td>
            <td>${r.d}</td>
            <td>${r.l}</td>
            <td>${r.gf}</td>
            <td>${r.ga}</td>
            <td class="st-gd">${gdStr}</td>
            <td class="st-pts">${r.pts}</td>
          </tr>`;
      }).join('');

      html += `
        <div class="stage">
          <div class="stage-header">
            <span class="stage-title">Group ${grpLetter}</span>
            <span class="stage-divider"></span>
            ${!anyPlayed ? '<span class="stage-count">No results yet</span>' : ''}
          </div>
          <div class="table-wrap">
            <table class="standings-table">
              <thead>
                <tr>
                  <th class="st-pos">#</th>
                  <th class="st-team">Team</th>
                  <th title="Played">P</th>
                  <th title="Won">W</th>
                  <th title="Drawn">D</th>
                  <th title="Lost">L</th>
                  <th title="Goals For">GF</th>
                  <th title="Goals Against">GA</th>
                  <th title="Goal Difference" class="st-gd">GD</th>
                  <th title="Points" class="st-pts">Pts</th>
                </tr>
              </thead>
              <tbody>${trs}</tbody>
            </table>
          </div>
        </div>`;
    });

    panel.innerHTML = html;
  }

  // ── Render: Knockout tab ──────────────────────────────────────────────────

  function renderKnockout(matches) {
    const panel = document.getElementById('tab-knockout');
    // Knockout matches have groupOrderID > 3
    const koMatches = matches.filter(m => m.group && m.group.groupOrderID > 3);

    if (koMatches.length === 0) {
      // Group stage is still ongoing — show a polished message with progress
      const finished = matches.filter(m => getStatus(m) === 'finished').length;
      const total    = matches.length;
      const pct      = Math.round(finished / total * 100);

      panel.innerHTML = `
        <div class="ko-pending-card">
          <div class="ko-trophy">🏆</div>
          <div class="ko-pending-title">Knockout Stage Pending</div>
          <div class="ko-pending-sub">
            The bracket will populate once all group-stage fixtures are complete.
          </div>
          <div class="ko-progress-wrap">
            <div class="ko-progress-bar" style="--pct:${pct}%"></div>
          </div>
          <div class="ko-progress-label">
            Group stage: <strong>${finished}</strong> of <strong>${total}</strong> matches played (${pct}%)
          </div>
          <div class="ko-rounds">
            <div class="ko-round-pill">Round of 32</div>
            <div class="ko-round-arrow">→</div>
            <div class="ko-round-pill">Round of 16</div>
            <div class="ko-round-arrow">→</div>
            <div class="ko-round-pill">Quarter-finals</div>
            <div class="ko-round-arrow">→</div>
            <div class="ko-round-pill">Semi-finals</div>
            <div class="ko-round-arrow">→</div>
            <div class="ko-round-pill ko-round-final">Final</div>
          </div>
        </div>`;
      return;
    }

    // Knockout data present — group by round and render as match cards
    const stages = buildStages(koMatches);
    panel.innerHTML = stages.map(stageHtml).join('');
  }

  // ── Render: Stats tab ─────────────────────────────────────────────────────

  function renderStats(matches) {
    const panel    = document.getElementById('tab-stats');
    const finished = matches.filter(m => m.matchIsFinished);

    if (finished.length === 0) {
      panel.innerHTML = `
        <div class="placeholder-card">
          <div class="placeholder-icon">⚽</div>
          <div class="placeholder-title">No results yet</div>
          <div class="placeholder-sub">Stats will appear once matches have been played.</div>
        </div>`;
      return;
    }

    // ── Aggregate ──
    let totalGoals = 0;
    let topMatch   = null;
    let topGoals   = 0;
    const scorers  = {};   // goalGetterID → { name, goals, team }
    const teamGoals = {};  // teamId → goals scored

    for (const m of finished) {
      const ft = m.matchResults.find(r => r.resultTypeID === 2);
      if (!ft) continue;
      const g = ft.pointsTeam1 + ft.pointsTeam2;
      totalGoals += g;
      if (g > topGoals) { topGoals = g; topMatch = m; }

      // Goals per team
      teamGoals[m.team1.teamId] = (teamGoals[m.team1.teamId] || 0) + ft.pointsTeam1;
      teamGoals[m.team2.teamId] = (teamGoals[m.team2.teamId] || 0) + ft.pointsTeam2;

      // Scorer tally — determine team by which side's score increased
      let prev1 = 0;
      for (const goal of m.goals || []) {
        if (!goal.isOwnGoal) {
          const id      = goal.goalGetterID;
          const teamObj = goal.scoreTeam1 > prev1 ? m.team1 : m.team2;
          if (!scorers[id]) {
            scorers[id] = { name: (goal.goalGetterName || '').trim(), goals: 0, team: teamObj };
          }
          scorers[id].goals++;
        }
        prev1 = goal.scoreTeam1;
      }
    }

    const avgGoals = finished.length ? (totalGoals / finished.length).toFixed(2) : '—';

    // Top-scoring match display
    let topMatchHtml = '';
    if (topMatch) {
      const ft = topMatch.matchResults.find(r => r.resultTypeID === 2);
      topMatchHtml = `
        <div class="stats-match-of-tournament">
          <div class="stage-header">
            <span class="stage-title">Highest-Scoring Match</span>
            <span class="stage-divider"></span>
            <span class="stage-count">${topGoals} goals</span>
          </div>
          ${matchCard(topMatch)}
        </div>`;
    }

    // Top 10 scorers
    const top10 = Object.values(scorers)
      .filter(s => s.name)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10);

    const scorerRows = top10.map((s, i) => `
      <tr>
        <td class="sc-rank">${i + 1}</td>
        <td class="sc-player">
          <div class="sc-player-inner">
            ${s.team ? flagImg(s.team, 'xs') : ''}
            <span class="sc-name">${s.name}</span>
          </div>
        </td>
        <td class="sc-team">${s.team ? (s.team.shortName || s.team.teamName) : '—'}</td>
        <td class="sc-goals">
          <span class="sc-goals-num">${s.goals}</span>
        </td>
      </tr>`).join('');

    const scorerTable = top10.length ? `
      <div class="stage">
        <div class="stage-header">
          <span class="stage-title">Top Scorers</span>
          <span class="stage-divider"></span>
        </div>
        <div class="table-wrap">
          <table class="scorers-table">
            <thead>
              <tr>
                <th class="sc-rank">#</th>
                <th class="sc-player">Player</th>
                <th class="sc-team">Team</th>
                <th class="sc-goals">Goals</th>
              </tr>
            </thead>
            <tbody>${scorerRows}</tbody>
          </table>
        </div>
      </div>` : '';

    panel.innerHTML = `
      <div class="ov-stats">
        <div class="ov-stat">
          <span class="ov-stat-num">${totalGoals}</span>
          <span class="ov-stat-lbl">Total Goals</span>
        </div>
        <div class="ov-stat">
          <span class="ov-stat-num">${avgGoals}</span>
          <span class="ov-stat-lbl">Goals / Match</span>
        </div>
        <div class="ov-stat">
          <span class="ov-stat-num">${finished.length}</span>
          <span class="ov-stat-lbl">Matches Played</span>
        </div>
        <div class="ov-stat">
          <span class="ov-stat-num">${top10.length ? top10[0].goals : '—'}</span>
          <span class="ov-stat-lbl">Most Goals (Player)</span>
        </div>
      </div>
      ${topMatchHtml}
      ${scorerTable}`;
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

  function renderAll(matches) {
    const dispatch = {
      overview: renderOverview,
      matches:  renderMatches,
      table:    renderTable,
      knockout: renderKnockout,
      stats:    renderStats,
    };
    const fn = dispatch[PAGE];
    if (fn) fn(matches);
  }

  async function load() {
    const btn = document.getElementById('refresh-btn');
    btn.disabled = true;
    setStatus(`<div class="spinner"></div><br>Loading match data…`, false);
    // Clear only the panel that exists on this page
    const panel = document.getElementById('tab-' + PAGE);
    if (panel) panel.innerHTML = '';

    try {
      // 1. Mock override (set by data/openligadb-wm26-2026.mock.js)
      if (window.__OPENLIGADB_WM26_MOCK__) {
        const matches = extractMatches(window.__OPENLIGADB_WM26_MOCK__);
        renderAll(matches);
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

      renderAll(matches);
      setStatus('', false);

    } catch (err) {
      setStatus(`⚠ Could not load match data.<br><small>${err.message}</small>`, true);
      setBadge('Error', '');
      setMeta('');
    } finally {
      btn.disabled = false;
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  document.getElementById('refresh-btn').addEventListener('click', load);
  load();
})();
