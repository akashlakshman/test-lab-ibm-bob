(function () {
  'use strict';

  const API_URL  = 'https://api.openligadb.de/getmatchdata/wm26/2026';
  const ROOT     = document.body.dataset.root || '';
  const FALLBACK = ROOT + 'data/openligadb-wm26-2026.json';

  // ── Hospitality data keyed by city name fragment ──────────────────────────
  // Each entry covers: tickets, hotels, transport, flights.
  // Airline hubs / airports are real; hotel tiers are illustrative.

  const CITY_INFO = {
    'Mexico City': {
      airport: 'Aeropuerto Internacional Benito Juárez (MEX)',
      airlines: ['Aeroméxico', 'Volaris', 'American Airlines', 'Delta'],
      transport: ['Metro Line 9 to Estadio Azteca', 'Uber/Cabify widely available', 'Metrobús corridor'],
      hotels: [
        { name: 'Grand Velas Mexico City', tier: 'Luxury', area: 'Polanco, 8 km to stadium' },
        { name: 'Marriott Reforma', tier: 'Premium', area: 'Centro, 12 km to stadium' },
        { name: 'City Express Pedregal', tier: 'Comfort', area: '3 km to Estadio Azteca' },
      ],
      ticketNote: 'Tickets via FIFA Ticketing portal. Hospitality packages include Category 1–3 seats, lounge access, and pre-match entertainment.',
    },
    'Guadalajara': {
      airport: 'Aeropuerto Internacional Miguel Hidalgo (GDL)',
      airlines: ['Aeroméxico', 'Volaris', 'United', 'Southwest'],
      transport: ['Mi Macro Peribús to Estadio Akron', 'Taxi/Uber from downtown (~30 min)', 'Línea 3 Metro (partial route)'],
      hotels: [
        { name: 'Hilton Guadalajara Midtown', tier: 'Luxury', area: 'Midtown, 12 km to stadium' },
        { name: 'Hotel Presidente Guadalajara', tier: 'Premium', area: 'Minerva district, 10 km' },
        { name: 'Camino Real Guadalajara', tier: 'Comfort', area: '14 km to Estadio Akron' },
      ],
      ticketNote: 'Official hospitality packages via FIFA include matchday transfers from designated hotels.',
    },
    'Monterrey': {
      airport: 'Aeropuerto Internacional General Mariano Escobedo (MTY)',
      airlines: ['Aeroméxico', 'Volaris', 'American', 'United'],
      transport: ['Metro Línea 2 to Estadio BBVA area', 'Official shuttle buses from city centre', 'Ecovía BRT line'],
      hotels: [
        { name: 'Safi Royal Luxury Valle', tier: 'Luxury', area: 'Valle, 6 km to stadium' },
        { name: 'Sheraton Ambassador', tier: 'Premium', area: 'Centro, 9 km to stadium' },
        { name: 'Fiesta Inn Monterrey', tier: 'Comfort', area: '4 km to Estadio BBVA' },
      ],
      ticketNote: 'Hospitality suites available for corporate groups. Packages include premium dining and dedicated entry gates.',
    },
    'Toronto': {
      airport: 'Toronto Pearson International (YYZ)',
      airlines: ['Air Canada', 'WestJet', 'American', 'Delta', 'United'],
      transport: ['TTC 509 streetcar to BMO Field', 'GO Train to Exhibition Station', 'King St tram from downtown (~15 min)'],
      hotels: [
        { name: 'Fairmont Royal York', tier: 'Luxury', area: 'Downtown, 3 km to stadium' },
        { name: 'Westin Harbour Castle', tier: 'Premium', area: 'Waterfront, 1.5 km to stadium' },
        { name: 'Holiday Inn Toronto Downtown', tier: 'Comfort', area: '2.5 km to BMO Field' },
      ],
      ticketNote: 'BMO Field expanded for WC2026. Hospitality club-level packages include waterfront views and gourmet dining.',
    },
    'Vancouver': {
      airport: 'Vancouver International (YVR)',
      airlines: ['Air Canada', 'WestJet', 'Alaska', 'United', 'Delta'],
      transport: ['Canada Line SkyTrain to BC Place', 'False Creek Ferry (seasonal)', 'Walking/cycling from downtown core'],
      hotels: [
        { name: 'Fairmont Pacific Rim', tier: 'Luxury', area: 'Coal Harbour, 1.2 km to BC Place' },
        { name: 'JW Marriott Parq Vancouver', tier: 'Premium', area: 'Adjacent to BC Place' },
        { name: 'Marriott Vancouver Downtown', tier: 'Comfort', area: '1 km to stadium' },
      ],
      ticketNote: 'BC Place offers premium club-level hospitality with panoramic city views. Packages include transit passes.',
    },
    'Los Angeles': {
      airport: 'Los Angeles International (LAX)',
      airlines: ['United', 'Delta', 'American', 'Southwest', 'Alaska'],
      transport: ['SoFi Stadium Shuttle from Metro C Line', 'Metro C (Green) Line to Hawthorne/Lennox', 'Rideshare drop-off at Stadium Gate'],
      hotels: [
        { name: 'The Ritz-Carlton, Los Angeles', tier: 'Luxury', area: 'Downtown LA, 12 km to SoFi' },
        { name: 'Marriott Manhattan Beach', tier: 'Premium', area: '3 km to SoFi Stadium' },
        { name: 'Courtyard LAX', tier: 'Comfort', area: 'Airport area, 8 km to stadium' },
      ],
      ticketNote: 'SoFi Stadium hospitality includes field-level clubs, private suites, and VIP parking. LA is a co-host city.',
    },
    'San Francisco': {
      airport: 'San Francisco International (SFO)',
      airlines: ['United', 'Delta', 'American', 'Southwest', 'Alaska'],
      transport: ['VTA Light Rail to Levi\'s Stadium', 'Caltrain + shuttle connection', 'Official FIFA fan buses from SF Civic Center'],
      hotels: [
        { name: 'Four Seasons San Francisco', tier: 'Luxury', area: 'SOMA, 50 km to Levi\'s (stay in city)' },
        { name: 'Aloft Santa Clara', tier: 'Premium', area: '2 km to Levi\'s Stadium' },
        { name: 'Hyatt House Santa Clara', tier: 'Comfort', area: 'Walking distance to stadium' },
      ],
      ticketNote: 'Levi\'s Stadium VIP clubs offer all-inclusive packages. Book Santa Clara hotels for walkable stadium access.',
    },
    'Seattle': {
      airport: 'Seattle-Tacoma International (SEA)',
      airlines: ['Alaska', 'Delta', 'United', 'Southwest', 'American'],
      transport: ['Link Light Rail to CenturyLink/Lumen Field Station', '5-min walk from Pioneer Square', 'King County Metro buses'],
      hotels: [
        { name: 'The Westin Seattle', tier: 'Luxury', area: 'Downtown, 1.5 km to Lumen Field' },
        { name: 'Hyatt Regency Seattle', tier: 'Premium', area: 'Convention District, 2 km' },
        { name: 'Embassy Suites Pioneer Square', tier: 'Comfort', area: '0.8 km to stadium' },
      ],
      ticketNote: 'Lumen Field\'s all-covered design protects from Seattle rain. Hospitality suites available on the east and west sides.',
    },
    'Dallas': {
      airport: 'Dallas/Fort Worth International (DFW)',
      airlines: ['American', 'Delta', 'United', 'Southwest', 'Spirit'],
      transport: ['TRE commuter rail to CentrePort/DFW, then shuttle', 'Official fan buses from AT&T Stadium lots', 'Rideshare (Uber/Lyft) widely available'],
      hotels: [
        { name: 'AT&T Stadium Loews Arlington', tier: 'Luxury', area: 'Adjacent to AT&T Stadium' },
        { name: 'Sheraton Arlington', tier: 'Premium', area: '1 km to AT&T Stadium' },
        { name: 'Fairfield Inn Arlington', tier: 'Comfort', area: '2 km to stadium' },
      ],
      ticketNote: 'AT&T Stadium may host multiple high-profile fixtures including semi-finals. Club Dez and suite packages available.',
    },
    'Houston': {
      airport: 'George Bush Intercontinental (IAH)',
      airlines: ['United', 'American', 'Delta', 'Southwest', 'Spirit'],
      transport: ['METRORail Red Line to NRG Park/Kirby', 'NRG Park official shuttles', 'Rideshare pickup/drop-off at designated zones'],
      hotels: [
        { name: 'JW Marriott Houston', tier: 'Luxury', area: 'Downtown, 6 km to NRG Stadium' },
        { name: 'Hilton Houston Plaza/Medical Ctr', tier: 'Premium', area: '3 km to stadium' },
        { name: 'Crowne Plaza NRG Park', tier: 'Comfort', area: 'Adjacent to NRG Stadium' },
      ],
      ticketNote: 'NRG Stadium is fully air-conditioned — crucial for June heat. Hospitality packages include climate-controlled suites.',
    },
    'Kansas City': {
      airport: 'Kansas City International (MCI)',
      airlines: ['Southwest', 'Delta', 'American', 'United', 'Frontier'],
      transport: ['KC Streetcar extension to Arrowhead area', 'Official shuttle buses from Downtown KC', 'Rideshare via designated stadium lots'],
      hotels: [
        { name: 'Hotel Kansas City, Autograph', tier: 'Luxury', area: 'Power & Light District, 10 km' },
        { name: 'Sheraton Kansas City', tier: 'Premium', area: 'Crown Center, 9 km to Arrowhead' },
        { name: 'Courtyard by Marriott Stadium', tier: 'Comfort', area: '2 km to Arrowhead Stadium' },
      ],
      ticketNote: 'Arrowhead Stadium is renowned for its atmosphere. Hospitality packages include tailgate experiences and suite access.',
    },
    'Miami': {
      airport: 'Miami International (MIA)',
      airlines: ['American', 'Delta', 'United', 'Avianca', 'LATAM'],
      transport: ['Metrorail Orange Line to Hard Rock Stadium shuttle', 'SunRail/Tri-Rail connections', 'Rideshare with dedicated fan drop zone'],
      hotels: [
        { name: 'Four Seasons Hotel Miami', tier: 'Luxury', area: 'Brickell, 22 km to Hard Rock' },
        { name: 'Marriott Miami Dadeland', tier: 'Premium', area: '14 km to Hard Rock Stadium' },
        { name: 'Courtyard Miami Dadeland', tier: 'Comfort', area: '12 km to stadium' },
      ],
      ticketNote: 'Hard Rock Stadium\'s open-air design with Miami skyline views. Premium Beach Club hospitality packages available.',
    },
    'Atlanta': {
      airport: 'Hartsfield-Jackson Atlanta International (ATL)',
      airlines: ['Delta', 'Southwest', 'American', 'United', 'Spirit'],
      transport: ['MARTA Red/Gold Line to GWCC/State Farm Arena Station', '5-min walk to Mercedes-Benz Stadium', 'Bike share from BeltLine'],
      hotels: [
        { name: 'W Atlanta Downtown', tier: 'Luxury', area: 'Adjacent to Mercedes-Benz Stadium' },
        { name: 'Omni Atlanta Hotel at CNN Center', tier: 'Premium', area: '0.5 km to stadium' },
        { name: 'Hampton Inn Atlanta Downtown', tier: 'Comfort', area: '1 km to stadium' },
      ],
      ticketNote: 'Mercedes-Benz Stadium is a retractable-roof venue in the heart of Atlanta. The FIFA Fan Festival will be hosted nearby.',
    },
    'Philadelphia': {
      airport: 'Philadelphia International (PHL)',
      airlines: ['American', 'Delta', 'United', 'Southwest', 'Spirit'],
      transport: ['SEPTA Broad Street Line to NRG/AT&T Station', 'Sports Complex shuttle from Center City', 'Rideshare to Lincoln Financial Field area'],
      hotels: [
        { name: 'Four Seasons Philadelphia', tier: 'Luxury', area: 'Center City, 10 km to stadium' },
        { name: 'Marriott Philadelphia Downtown', tier: 'Premium', area: '9 km to Lincoln Financial' },
        { name: 'Holiday Inn Stadium Area', tier: 'Comfort', area: '1 km to Lincoln Financial' },
      ],
      ticketNote: 'Lincoln Financial Field is in the South Philly Sports Complex. Tailgate culture is strong — hospitality lots open 4h before kickoff.',
    },
    'Boston': {
      airport: 'Boston Logan International (BOS)',
      airlines: ['Delta', 'American', 'United', 'JetBlue', 'Southwest'],
      transport: ['Commuter Rail Foxboro Special Event trains from South Station', 'Official fan buses from Copley Square', 'Limited rideshare access — pre-book'],
      hotels: [
        { name: 'The Ritz-Carlton Boston', tier: 'Luxury', area: 'Back Bay, 40 km to Gillette (stay in Boston)' },
        { name: 'Wrentham Village Inn', tier: 'Premium', area: '8 km to Gillette Stadium' },
        { name: 'Hampton Inn Foxborough', tier: 'Comfort', area: '2 km to Gillette Stadium' },
      ],
      ticketNote: 'Gillette Stadium is in Foxborough. Stay in Boston and take the event train — it is the recommended approach for the best experience.',
    },
    'New York': {
      airport: 'Newark Liberty International (EWR) / JFK International (JFK)',
      airlines: ['United', 'Delta', 'American', 'JetBlue', 'Southwest'],
      transport: ['NJ Transit train to Meadowlands Sports Complex', 'MetLife Stadium shuttle from Secaucus Junction', 'Rideshare via designated MetLife lots'],
      hotels: [
        { name: 'The Plaza New York', tier: 'Luxury', area: 'Midtown Manhattan, 25 km to MetLife' },
        { name: 'Meadowlands Plaza Hotel', tier: 'Premium', area: 'Adjacent to MetLife Stadium' },
        { name: 'Hilton Hasbrouck Heights', tier: 'Comfort', area: '3 km to MetLife Stadium' },
      ],
      ticketNote: 'MetLife Stadium is expected to host the World Cup Final. VIP hospitality packages include NYC skyline suites and gala dinners.',
    },
  };

  // ── Helpers (duplicated from app.js — match.js is standalone) ─────────────

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

  function fmtDateTime(isoUTC) {
    const d = new Date(isoUTC.endsWith('Z') ? isoUTC : isoUTC + 'Z');
    return d.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function flagImg(team) {
    const short = (team.shortName || '??').slice(0, 3).toUpperCase();
    if (team.teamIconUrl) {
      return `<img class="team-flag" src="${team.teamIconUrl}"
        alt="${short}" title="${team.teamName}"
        onerror="this.outerHTML=\`<span class='flag-fallback'>${short}</span>\`">`;
    }
    return `<span class="flag-fallback">${short}</span>`;
  }

  function extractMatches(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.matches)) return data.matches;
    return [];
  }

  // ── City info lookup ──────────────────────────────────────────────────────
  // Finds the best matching entry by checking if the city name contains a key.

  function getCityInfo(locationCity) {
    if (!locationCity) return null;
    for (const key of Object.keys(CITY_INFO)) {
      if (locationCity.includes(key)) return { city: key, ...CITY_INFO[key] };
    }
    return null;
  }

  // ── Tier badge ────────────────────────────────────────────────────────────

  function tierClass(tier) {
    if (tier === 'Luxury')  return 'tier-luxury';
    if (tier === 'Premium') return 'tier-premium';
    return 'tier-comfort';
  }

  // ── Render the hospitality page ───────────────────────────────────────────

  function renderMatchDetail(match) {
    const { ft, ht }  = getScore(match);
    const status      = getStatus(match);
    const cityInfo    = getCityInfo(match.location && match.location.locationCity);
    const city        = match.location ? match.location.locationCity : 'Venue TBC';
    const stadium     = match.location ? match.location.locationStadium : '';
    const dt          = match.matchDateTimeUTC || match.matchDateTime;

    // ── Hero section ──
    let scoreHtml = '';
    if (status === 'finished' && ft) {
      scoreHtml = `
        <div class="md-score-line">
          <span class="md-score-num">${ft[0]}</span>
          <span class="md-score-sep">–</span>
          <span class="md-score-num">${ft[1]}</span>
        </div>
        ${ht ? `<div class="md-ht">Half-time: ${ht[0]}–${ht[1]}</div>` : ''}`;
    } else if (status === 'live' && ft) {
      scoreHtml = `
        <div class="md-score-line">
          <span class="md-score-num">${ft[0]}</span>
          <span class="md-score-sep">–</span>
          <span class="md-score-num">${ft[1]}</span>
        </div>
        <span class="md-live-badge">● Live</span>`;
    } else {
      scoreHtml = `<div class="md-kickoff">${fmtDateTime(dt)}</div>`;
    }

    // ── Goal scorers ──
    let goalsList = '';
    if ((match.goals || []).length > 0) {
      const byT1 = [], byT2 = [];
      let prev = 0;
      for (const g of match.goals) {
        const suffix = g.isOwnGoal ? ' (og)' : g.isPenalty ? ' (pen)' : '';
        const entry = `<li>${(g.goalGetterName || '').trim()}${suffix} <span class="md-minute">${g.matchMinute}'</span></li>`;
        if (g.scoreTeam1 > prev) byT1.push(entry); else byT2.push(entry);
        prev = g.scoreTeam1;
      }
      goalsList = `
        <div class="md-goals-grid">
          <ul class="md-goals-list md-goals-t1">${byT1.join('') || '<li class="md-no-goals">—</li>'}</ul>
          <ul class="md-goals-list md-goals-t2">${byT2.join('') || '<li class="md-no-goals">—</li>'}</ul>
        </div>`;
    }

    // ── Hospitality sections ──
    let hospHtml = '';
    if (cityInfo) {
      // Tickets
      hospHtml += `
        <div class="hosp-section" id="tickets">
          <div class="hosp-section-header">
            <span class="hosp-icon">🎟️</span>
            <h2 class="hosp-section-title">Match Tickets</h2>
          </div>
          <div class="hosp-card hosp-ticket-card">
            <p class="hosp-ticket-note">${cityInfo.ticketNote}</p>
            <div class="hosp-ticket-tiers">
              <div class="hosp-ticket-tier">
                <span class="hosp-tier-label tier-luxury">Category 1</span>
                <span class="hosp-tier-desc">Premium seats, central/lower tier, fastest entry</span>
              </div>
              <div class="hosp-ticket-tier">
                <span class="hosp-tier-label tier-premium">Category 2</span>
                <span class="hosp-tier-desc">Mid-range seats with excellent sightlines</span>
              </div>
              <div class="hosp-ticket-tier">
                <span class="hosp-tier-label tier-comfort">Category 3</span>
                <span class="hosp-tier-desc">Upper tier, great atmosphere, best value</span>
              </div>
            </div>
            <a class="hosp-cta-btn" href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/tickets" target="_blank" rel="noopener">Buy Tickets via FIFA →</a>
          </div>
        </div>`;

      // Accommodation
      const hotelsHtml = cityInfo.hotels.map(h => `
        <div class="hosp-hotel-card">
          <div class="hosp-hotel-header">
            <span class="hosp-hotel-name">${h.name}</span>
            <span class="hosp-tier-label ${tierClass(h.tier)}">${h.tier}</span>
          </div>
          <p class="hosp-hotel-area">${h.area}</p>
        </div>`).join('');

      hospHtml += `
        <div class="hosp-section" id="accommodation">
          <div class="hosp-section-header">
            <span class="hosp-icon">🏨</span>
            <h2 class="hosp-section-title">Accommodation</h2>
          </div>
          <div class="hosp-hotel-grid">${hotelsHtml}</div>
        </div>`;

      // Transport
      const transportHtml = cityInfo.transport.map(t => `
        <li class="hosp-transport-item">
          <span class="hosp-transport-icon">🚇</span>
          <span>${t}</span>
        </li>`).join('');

      hospHtml += `
        <div class="hosp-section" id="transport">
          <div class="hosp-section-header">
            <span class="hosp-icon">🚆</span>
            <h2 class="hosp-section-title">Getting to the Stadium</h2>
          </div>
          <div class="hosp-card">
            <ul class="hosp-transport-list">${transportHtml}</ul>
          </div>
        </div>`;

      // Flights
      const airlinesHtml = cityInfo.airlines.map(a => `<span class="hosp-airline-pill">${a}</span>`).join('');

      hospHtml += `
        <div class="hosp-section" id="flights">
          <div class="hosp-section-header">
            <span class="hosp-icon">✈️</span>
            <h2 class="hosp-section-title">Flights &amp; Airport</h2>
          </div>
          <div class="hosp-card">
            <p class="hosp-airport-name">${cityInfo.airport}</p>
            <div class="hosp-airlines">${airlinesHtml}</div>
            <p class="hosp-flight-note">Search and compare flights to this airport via your preferred booking platform.</p>
            <div class="hosp-flight-links">
              <a class="hosp-link-btn" href="https://www.google.com/flights?q=flights+to+${encodeURIComponent(cityInfo.airport)}" target="_blank" rel="noopener">Google Flights</a>
              <a class="hosp-link-btn" href="https://www.skyscanner.com/flights-to/${encodeURIComponent(city.split(' ')[0])}" target="_blank" rel="noopener">Skyscanner</a>
              <a class="hosp-link-btn" href="https://www.kayak.com/flights" target="_blank" rel="noopener">Kayak</a>
            </div>
          </div>
        </div>`;
    } else {
      hospHtml = `
        <div class="hosp-section">
          <div class="hosp-card hosp-no-info">
            <p>Hospitality information for this venue will be available closer to the tournament.</p>
          </div>
        </div>`;
    }

    // ── Package CTA — Formspree-powered enquiry form ──
    // Replace YOUR_FORM_ID with the ID from https://formspree.io (free tier)
    // Formspree sends a real email to your inbox on every submission, no server needed.
    const matchLabel = match.team1.teamName + ' vs ' + match.team2.teamName;
    const packageCta = `
      <div class="hosp-package-cta" id="enquire">
        <div class="hosp-package-inner">
          <h2 class="hosp-package-title">All-in-One Hospitality Package</h2>
          <p class="hosp-package-sub">Tickets, flights, hotel, and transfers — bundled and delivered to your inbox.</p>
          <div class="hosp-package-features">
            <span class="hosp-feature">✓ Match ticket (Category 1)</span>
            <span class="hosp-feature">✓ Return flights</span>
            <span class="hosp-feature">✓ 3-night hotel stay</span>
            <span class="hosp-feature">✓ Stadium transfers</span>
            <span class="hosp-feature">✓ Dedicated host</span>
          </div>
          <form class="hosp-enquiry-form"
                action="https://formspree.io/f/YOUR_FORM_ID"
                method="POST">
            <input type="hidden" name="match"    value="${matchLabel}">
            <input type="hidden" name="venue"    value="${city}${stadium ? ', ' + stadium : ''}">
            <input type="hidden" name="kickoff"  value="${fmtDateTime(dt)}">
            <div class="hosp-form-row">
              <input  class="hosp-input" type="text"  name="name"  placeholder="Your name"  required>
              <input  class="hosp-input" type="email" name="email" placeholder="Your email" required>
            </div>
            <textarea class="hosp-input hosp-textarea" name="message"
              placeholder="Any questions or preferences? (optional)" rows="3"></textarea>
            <button class="hosp-package-btn hosp-submit-btn" type="submit">
              Send Enquiry
            </button>
            <p class="hosp-form-note">
              Your enquiry is sent directly to our hospitality team. We reply within 24 hours.
            </p>
          </form>
        </div>
      </div>`;

    // ── Assemble full page ──
    document.getElementById('match-detail').innerHTML = `
      <div class="md-hero">
        <div class="md-match-eyebrow">${match.group ? match.group.groupName.replace('Gruppenphase', 'Group Stage Matchday') : ''} · ${city}${stadium ? ', ' + stadium : ''}</div>
        <div class="md-teams-row">
          <div class="md-team md-team1">
            ${flagImg(match.team1)}
            <span class="md-team-name">${match.team1.teamName}</span>
          </div>
          <div class="md-center">
            ${scoreHtml}
          </div>
          <div class="md-team md-team2">
            ${flagImg(match.team2)}
            <span class="md-team-name">${match.team2.teamName}</span>
          </div>
        </div>
        ${goalsList ? `<div class="md-goals-section">${goalsList}</div>` : ''}
      </div>

      <div class="md-hosp-nav">
        <a href="#tickets"       class="md-hosp-nav-link">Tickets</a>
        <a href="#accommodation" class="md-hosp-nav-link">Accommodation</a>
        <a href="#transport"     class="md-hosp-nav-link">Transport</a>
        <a href="#flights"       class="md-hosp-nav-link">Flights</a>
        <a href="#enquire"       class="md-hosp-nav-link md-hosp-nav-cta">Enquire</a>
      </div>

      <div class="md-hosp-body">
        ${hospHtml}
        ${packageCta}
      </div>`;

    // Update document title
    document.title = `${match.team1.teamName} vs ${match.team2.teamName} — WC 2026 Hospitality`;
  }

  // ── Load match by ?id= ────────────────────────────────────────────────────

  async function load() {
    const params  = new URLSearchParams(window.location.search);
    const matchId = parseInt(params.get('id'), 10);

    const detail = document.getElementById('match-detail');

    if (!matchId) {
      detail.innerHTML = '<p class="md-error">No match ID supplied. <a href="overview.html">Back to Overview</a></p>';
      return;
    }

    detail.innerHTML = '<div class="md-loading"><div class="spinner"></div><br>Loading match…</div>';

    let matches = [];

    try {
      if (window.__OPENLIGADB_WM26_MOCK__) {
        matches = extractMatches(window.__OPENLIGADB_WM26_MOCK__);
      } else {
        try {
          const r = await fetch(API_URL, { cache: 'no-store' });
          if (!r.ok) throw new Error('HTTP ' + r.status);
          matches = extractMatches(await r.json());
        } catch {
          const r2 = await fetch(FALLBACK, { cache: 'no-store' });
          if (!r2.ok) throw new Error('Fallback failed');
          matches = extractMatches(await r2.json());
        }
      }

      const match = matches.find(m => m.matchID === matchId);
      if (!match) {
        detail.innerHTML = `<p class="md-error">Match #${matchId} not found. <a href="overview.html">Back to Overview</a></p>`;
        return;
      }

      renderMatchDetail(match);

    } catch (err) {
      detail.innerHTML = `<p class="md-error">Could not load match data: ${err.message}. <a href="overview.html">Back to Overview</a></p>`;
    }
  }

  load();
})();
