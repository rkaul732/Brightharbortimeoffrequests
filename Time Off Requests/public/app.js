(function () {
  const statusLabels = {
    in_review: "In review",
    approved: "Approved",
    denied: "Denied"
  };

  const statusValues = Object.keys(statusLabels);
  const demoKey = "bright-harbor-time-off-demo";
  const sessionKey = "bright-harbor-admin-session";

  const sampleRequests = [
    {
      id: "demo-1",
      first_name: "Amara",
      last_name: "Bell",
      email: "amara.bell@brightharbor.example",
      department: "Client Services",
      manager: "Jordan Patel",
      time_off_type: "Paid time off",
      start_date: "2026-09-14",
      end_date: "2026-09-18",
      partial_day: "Full days",
      business_days: 5,
      reason: "Family travel.",
      decision_note: "",
      status: "in_review",
      created_at: "2026-09-01T14:00:00.000Z",
      updated_at: "2026-09-01T14:00:00.000Z"
    },
    {
      id: "demo-2",
      first_name: "Theo",
      last_name: "Choi",
      email: "theo.choi@brightharbor.example",
      department: "Technology",
      manager: "Nina Ames",
      time_off_type: "Personal day",
      start_date: "2026-09-22",
      end_date: "2026-09-22",
      partial_day: "Full days",
      business_days: 1,
      reason: "Appointment.",
      decision_note: "Coverage confirmed.",
      status: "approved",
      created_at: "2026-08-28T10:00:00.000Z",
      updated_at: "2026-08-29T17:30:00.000Z"
    },
    {
      id: "demo-3",
      first_name: "Mina",
      last_name: "Rivera",
      email: "mina.rivera@brightharbor.example",
      department: "Harbor Operations",
      manager: "Sam Green",
      time_off_type: "Unpaid time",
      start_date: "2026-10-01",
      end_date: "2026-10-02",
      partial_day: "Full days",
      business_days: 2,
      reason: "Out of town.",
      decision_note: "Blackout date overlap.",
      status: "denied",
      created_at: "2026-08-30T16:00:00.000Z",
      updated_at: "2026-09-02T12:10:00.000Z"
    }
  ];

  const state = {
    requests: [],
    admin: null,
    demoMode: false,
    viewMode: "list",
    calendarMode: "month",
    calendarDate: toDateInput(new Date())
  };

  const els = {
    employeeView: document.querySelector("#employee-view"),
    adminView: document.querySelector("#admin-view"),
    navLinks: document.querySelectorAll("[data-nav]"),
    requestForm: document.querySelector("#request-form"),
    requestMessage: document.querySelector("#request-message"),
    daysOutput: document.querySelector("#days-output"),
    employeeRequestList: document.querySelector("#employee-request-list"),
    queueTotal: document.querySelector("#queue-total"),
    queueReview: document.querySelector("#queue-review"),
    queueApproved: document.querySelector("#queue-approved"),
    loginPanel: document.querySelector("#login-panel"),
    adminPanel: document.querySelector("#admin-panel"),
    adminLoginForm: document.querySelector("#admin-login-form"),
    loginMessage: document.querySelector("#login-message"),
    logoutButton: document.querySelector("#logout-button"),
    adminSearch: document.querySelector("#admin-search"),
    viewMode: document.querySelector("#view-mode"),
    calendarModeControl: document.querySelector("#calendar-mode-control"),
    calendarDateControl: document.querySelector("#calendar-date-control"),
    calendarMode: document.querySelector("#calendar-mode"),
    calendarDate: document.querySelector("#calendar-date"),
    adminTotal: document.querySelector("#admin-total"),
    adminReview: document.querySelector("#admin-review"),
    adminApproved: document.querySelector("#admin-approved"),
    adminDenied: document.querySelector("#admin-denied"),
    listView: document.querySelector("#list-view"),
    calendarView: document.querySelector("#calendar-view")
  };

  init();

  async function init() {
    state.admin = readSession();
    state.calendarDate = toDateInput(new Date());
    els.calendarDate.value = state.calendarDate;

    bindEvents();
    await hydrate();
    route();
  }

  function bindEvents() {
    window.addEventListener("hashchange", route);

    els.requestForm.addEventListener("input", () => {
      updateBusinessDayOutput();
    });

    els.requestForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await submitRequest(new FormData(els.requestForm));
    });

    els.adminLoginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await loginAdmin(new FormData(els.adminLoginForm));
    });

    els.logoutButton.addEventListener("click", () => {
      state.admin = null;
      sessionStorage.removeItem(sessionKey);
      renderAdmin();
    });

    els.adminSearch.addEventListener("input", renderAdminRequests);
    els.viewMode.addEventListener("change", () => {
      state.viewMode = els.viewMode.value;
      renderAdminRequests();
    });
    els.calendarMode.addEventListener("change", () => {
      state.calendarMode = els.calendarMode.value;
      renderAdminRequests();
    });
    els.calendarDate.addEventListener("change", () => {
      state.calendarDate = els.calendarDate.value || toDateInput(new Date());
      renderAdminRequests();
    });
  }

  async function hydrate() {
    state.demoMode = !(await isBackendReady());
    if (state.demoMode) {
      state.requests = readDemoRequests();
    } else if (state.admin) {
      try {
        await loadAdminRequests();
      } catch (error) {
        setMessage(els.loginMessage, error.message || "Please sign in again.", "error");
      }
    } else {
      state.requests = [];
    }
    renderEmployeeSummary();
    renderAdmin();
  }

  async function isBackendReady() {
    try {
      const response = await fetch("/.netlify/functions/config", {
        headers: { accept: "application/json" }
      });
      if (!response.ok) return false;
      const config = await response.json();
      return Boolean(config.backendReady);
    } catch (error) {
      return false;
    }
  }

  function route() {
    const target = location.hash.replace("#", "") === "admin" ? "admin" : "employee";
    els.employeeView.hidden = target !== "employee";
    els.adminView.hidden = target !== "admin";
    els.navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.nav === target);
    });
    if (target === "admin") {
      renderAdmin();
    } else {
      renderEmployeeSummary();
    }
  }

  async function submitRequest(formData) {
    const payload = {
      first_name: clean(formData.get("firstName")),
      last_name: clean(formData.get("lastName")),
      email: clean(formData.get("email")).toLowerCase(),
      department: clean(formData.get("department")),
      manager: clean(formData.get("manager")),
      time_off_type: clean(formData.get("timeOffType")),
      start_date: clean(formData.get("startDate")),
      end_date: clean(formData.get("endDate")),
      partial_day: clean(formData.get("partialDay")),
      reason: clean(formData.get("reason")),
      business_days: calculateBusinessDays(formData.get("startDate"), formData.get("endDate"), formData.get("partialDay")),
      status: "in_review"
    };

    const error = validateRequest(payload);
    if (error) {
      setMessage(els.requestMessage, error, "error");
      return;
    }

    toggleForm(els.requestForm, true);
    setMessage(els.requestMessage, "Submitting request...", "");

    try {
      const saved = state.demoMode ? saveDemoRequest(payload) : await createRemoteRequest(payload);
      state.requests = upsertRequest(saved, state.requests);
      els.requestForm.reset();
      updateBusinessDayOutput();
      renderEmployeeSummary();
      if (state.admin) renderAdminRequests();
      setMessage(els.requestMessage, "Request submitted for review.", "success");
    } catch (error) {
      setMessage(els.requestMessage, error.message || "Could not submit the request.", "error");
    } finally {
      toggleForm(els.requestForm, false);
    }
  }

  async function createRemoteRequest(payload) {
    const response = await fetch("/.netlify/functions/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || "Could not submit the request.");
    }
    return normalizeRequest(body.request);
  }

  async function loginAdmin(formData) {
    const email = clean(formData.get("email")).toLowerCase();
    const password = String(formData.get("password") || "");
    if (!email || !password) {
      setMessage(els.loginMessage, "Enter an admin email and password.", "error");
      return;
    }

    setMessage(els.loginMessage, "Signing in...", "");
    toggleForm(els.adminLoginForm, true);

    try {
      if (state.demoMode) {
        state.admin = { email, token: "demo-token" };
      } else {
        const response = await fetch("/.netlify/functions/admin-login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.error || "Sign in failed.");
        }
        state.admin = { email: body.email, token: body.accessToken };
        await loadAdminRequests();
      }
      sessionStorage.setItem(sessionKey, JSON.stringify(state.admin));
      setMessage(els.loginMessage, "", "");
      renderAdmin();
    } catch (error) {
      setMessage(els.loginMessage, error.message || "Sign in failed.", "error");
    } finally {
      toggleForm(els.adminLoginForm, false);
    }
  }

  async function loadAdminRequests() {
    if (!state.admin || state.demoMode) return;
    const response = await fetch("/.netlify/functions/admin-requests", {
      headers: { authorization: `Bearer ${state.admin.token}` }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      state.admin = null;
      sessionStorage.removeItem(sessionKey);
      throw new Error(body.error || "Could not load admin requests.");
    }
    state.requests = (body.requests || []).map(normalizeRequest);
  }

  async function updateStatus(id, status, decisionNote) {
    if (!statusValues.includes(status)) return;

    if (state.demoMode) {
      const updatedAt = new Date().toISOString();
      state.requests = state.requests.map((request) =>
        request.id === id ? { ...request, status, decision_note: decisionNote, updated_at: updatedAt } : request
      );
      writeDemoRequests(state.requests);
      renderAll();
      return;
    }

    const response = await fetch("/.netlify/functions/admin-update-request", {
      method: "POST",
      headers: {
        authorization: `Bearer ${state.admin.token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ id, status, decision_note: decisionNote })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || "Could not update status.");
    }
    state.requests = upsertRequest(normalizeRequest(body.request), state.requests);
    renderAll();
  }

  function renderAll() {
    renderEmployeeSummary();
    renderAdminRequests();
  }

  function renderEmployeeSummary() {
    const sorted = alphabetize(state.requests).slice(0, 6);
    const counts = countStatuses(state.requests);
    els.queueTotal.textContent = state.requests.length;
    els.queueReview.textContent = counts.in_review;
    els.queueApproved.textContent = counts.approved;
    els.employeeRequestList.innerHTML = sorted.length
      ? sorted.map((request) => requestRow(request, false)).join("")
      : `<div class="empty-state">No requests yet.</div>`;
  }

  function renderAdmin() {
    const signedIn = Boolean(state.admin);
    els.loginPanel.hidden = signedIn;
    els.adminPanel.hidden = !signedIn;
    if (signedIn) {
      renderAdminRequests();
    }
  }

  function renderAdminRequests() {
    if (!state.admin) return;

    const filtered = filterRequests(state.requests, els.adminSearch.value);
    const counts = countStatuses(filtered);
    els.adminTotal.textContent = filtered.length;
    els.adminReview.textContent = counts.in_review;
    els.adminApproved.textContent = counts.approved;
    els.adminDenied.textContent = counts.denied;

    const isCalendar = state.viewMode === "calendar";
    els.listView.hidden = isCalendar;
    els.calendarView.hidden = !isCalendar;
    els.calendarModeControl.hidden = !isCalendar;
    els.calendarDateControl.hidden = !isCalendar;

    if (isCalendar) {
      renderCalendar(filtered);
    } else {
      renderList(filtered);
    }
  }

  function renderList(requests) {
    const sorted = alphabetize(requests);
    els.listView.innerHTML = sorted.length
      ? sorted.map((request) => adminRequestRow(request)).join("")
      : `<div class="empty-state">No matching requests.</div>`;

    els.listView.querySelectorAll("[data-save-status]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.saveStatus;
        const wrapper = button.closest(".admin-request");
        const select = wrapper.querySelector("[data-status-select]");
        const note = wrapper.querySelector("[data-decision-note]");
        button.disabled = true;
        button.textContent = "Saving...";
        try {
          await updateStatus(id, select.value, note.value.trim());
        } catch (error) {
          button.disabled = false;
          button.textContent = "Save";
          alert(error.message || "Could not save this update.");
        }
      });
    });
  }

  function renderCalendar(requests) {
    const focus = parseLocalDate(state.calendarDate) || new Date();
    const mode = state.calendarMode;
    const cells = mode === "day" ? dayCells(focus) : mode === "week" ? weekCells(focus) : monthCells(focus);
    const title = calendarTitle(focus, mode);
    const weekdays = mode === "day" ? "" : weekdayHeader();

    els.calendarView.innerHTML = `
      <div class="calendar-heading">
        <h2>${escapeHtml(title)}</h2>
        <span class="meta-line">${requests.length} requests shown</span>
      </div>
      <div class="calendar-grid ${mode}">
        ${weekdays}
        ${cells.map((cell) => calendarCell(cell, requests, mode)).join("")}
      </div>
    `;
  }

  function adminRequestRow(request) {
    return `
      <article class="admin-request">
        ${requestRow(request, true)}
        <div class="decision-box">
          <label>
            <span>Approval type</span>
            <select data-status-select>
              ${statusValues.map((status) => `<option value="${status}" ${request.status === status ? "selected" : ""}>${statusLabels[status]}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Decision note</span>
            <textarea data-decision-note rows="3">${escapeHtml(request.decision_note || "")}</textarea>
          </label>
          <button class="status-save" type="button" data-save-status="${escapeHtml(request.id)}">Save</button>
        </div>
      </article>
    `;
  }

  function requestRow(request, detailed) {
    const name = `${request.first_name} ${request.last_name}`;
    return `
      <article class="request-row ${request.status}">
        <header>
          <div>
            <strong>${escapeHtml(name)}</strong>
            <small>${escapeHtml(request.department)} • ${escapeHtml(request.time_off_type)}</small>
          </div>
          <span class="status-pill ${request.status}">${statusLabels[request.status]}</span>
        </header>
        <div class="meta-line">${formatDateRange(request.start_date, request.end_date)} • ${request.business_days} business ${request.business_days === 1 ? "day" : "days"}</div>
        ${detailed ? `<div class="meta-line">${escapeHtml(request.email)} • Manager: ${escapeHtml(request.manager)}</div>` : ""}
        ${request.reason ? `<p>${escapeHtml(request.reason)}</p>` : ""}
        ${detailed && request.decision_note ? `<div class="meta-line">Decision note: ${escapeHtml(request.decision_note)}</div>` : ""}
      </article>
    `;
  }

  function calendarCell(cell, requests, mode) {
    const matching = alphabetize(requests.filter((request) => overlapsDate(request, cell.date)));
    return `
      <div class="calendar-cell ${cell.muted ? "muted" : ""}">
        <time datetime="${cell.iso}">${escapeHtml(cell.label)}</time>
        ${matching.length ? matching.map(calendarRequest).join("") : mode === "day" ? `<div class="empty-state">No requests for this day.</div>` : ""}
      </div>
    `;
  }

  function calendarRequest(request) {
    return `
      <span class="calendar-request ${request.status}">
        <strong>${escapeHtml(request.last_name)}, ${escapeHtml(request.first_name)}</strong>
        ${statusLabels[request.status]} • ${escapeHtml(request.time_off_type)}
      </span>
    `;
  }

  function weekdayHeader() {
    return `
      <div class="weekday-row">
        ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<span class="weekday">${day}</span>`).join("")}
      </div>
    `;
  }

  function monthCells(focus) {
    const start = new Date(focus.getFullYear(), focus.getMonth(), 1);
    const end = new Date(focus.getFullYear(), focus.getMonth() + 1, 0);
    const first = new Date(start);
    first.setDate(first.getDate() - first.getDay());
    const last = new Date(end);
    last.setDate(last.getDate() + (6 - last.getDay()));
    const cells = [];
    for (const date = new Date(first); date <= last; date.setDate(date.getDate() + 1)) {
      cells.push({
        date: new Date(date),
        iso: toDateInput(date),
        label: String(date.getDate()),
        muted: date.getMonth() !== focus.getMonth()
      });
    }
    return cells;
  }

  function weekCells(focus) {
    const start = new Date(focus);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        date,
        iso: toDateInput(date),
        label: date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
        muted: false
      };
    });
  }

  function dayCells(focus) {
    return [
      {
        date: focus,
        iso: toDateInput(focus),
        label: focus.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
        muted: false
      }
    ];
  }

  function calendarTitle(focus, mode) {
    if (mode === "day") {
      return focus.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }
    if (mode === "week") {
      const start = weekCells(focus)[0].date;
      const end = weekCells(focus)[6].date;
      return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return focus.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }

  function updateBusinessDayOutput() {
    const formData = new FormData(els.requestForm);
    const days = calculateBusinessDays(formData.get("startDate"), formData.get("endDate"), formData.get("partialDay"));
    els.daysOutput.textContent = `${days} business ${days === 1 ? "day" : "days"}`;
  }

  function calculateBusinessDays(startValue, endValue, partialDay) {
    const start = parseLocalDate(startValue);
    const end = parseLocalDate(endValue);
    if (!start || !end || start > end) return 0;
    let days = 0;
    for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const day = date.getDay();
      if (day !== 0 && day !== 6) days += 1;
    }
    if (days === 1 && partialDay && partialDay.includes("half")) return 0.5;
    return days;
  }

  function validateRequest(payload) {
    const required = ["first_name", "last_name", "email", "department", "manager", "time_off_type", "start_date", "end_date", "partial_day"];
    if (required.some((key) => !payload[key])) return "Complete all required fields.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return "Enter a valid email address.";
    if (!payload.business_days || payload.business_days <= 0) return "Choose dates that include at least one business day.";
    return "";
  }

  function filterRequests(requests, query) {
    const term = clean(query).toLowerCase();
    if (!term) return requests;
    return requests.filter((request) =>
      [request.first_name, request.last_name, request.email, request.department, request.manager, request.time_off_type, statusLabels[request.status]]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }

  function alphabetize(requests) {
    return [...requests].sort((a, b) => {
      const last = a.last_name.localeCompare(b.last_name);
      if (last) return last;
      const first = a.first_name.localeCompare(b.first_name);
      if (first) return first;
      return a.start_date.localeCompare(b.start_date);
    });
  }

  function countStatuses(requests) {
    return requests.reduce(
      (counts, request) => {
        counts[request.status] += 1;
        return counts;
      },
      { in_review: 0, approved: 0, denied: 0 }
    );
  }

  function overlapsDate(request, date) {
    const start = parseLocalDate(request.start_date);
    const end = parseLocalDate(request.end_date);
    return Boolean(start && end && date >= start && date <= end);
  }

  function saveDemoRequest(payload) {
    const now = new Date().toISOString();
    const request = normalizeRequest({
      ...payload,
      id: crypto.randomUUID ? crypto.randomUUID() : `demo-${Date.now()}`,
      decision_note: "",
      created_at: now,
      updated_at: now
    });
    const requests = upsertRequest(request, readDemoRequests());
    writeDemoRequests(requests);
    return request;
  }

  function readDemoRequests() {
    try {
      const saved = JSON.parse(localStorage.getItem(demoKey) || "null");
      if (Array.isArray(saved)) return saved.map(normalizeRequest);
    } catch (error) {
      localStorage.removeItem(demoKey);
    }
    writeDemoRequests(sampleRequests);
    return sampleRequests.map(normalizeRequest);
  }

  function writeDemoRequests(requests) {
    localStorage.setItem(demoKey, JSON.stringify(requests));
  }

  function readSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem(sessionKey) || "null");
      return session && session.token ? session : null;
    } catch (error) {
      return null;
    }
  }

  function upsertRequest(request, requests) {
    const next = requests.filter((item) => item.id !== request.id);
    next.push(request);
    return alphabetize(next);
  }

  function normalizeRequest(request) {
    return {
      id: String(request.id),
      first_name: request.first_name || request.firstName || "",
      last_name: request.last_name || request.lastName || "",
      email: request.email || "",
      department: request.department || "",
      manager: request.manager || "",
      time_off_type: request.time_off_type || request.timeOffType || "",
      start_date: request.start_date || request.startDate || "",
      end_date: request.end_date || request.endDate || "",
      partial_day: request.partial_day || request.partialDay || "Full days",
      business_days: Number(request.business_days || request.businessDays || 0),
      reason: request.reason || "",
      decision_note: request.decision_note || request.decisionNote || "",
      status: statusLabels[request.status] ? request.status : "in_review",
      created_at: request.created_at || new Date().toISOString(),
      updated_at: request.updated_at || request.created_at || new Date().toISOString()
    };
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function parseLocalDate(value) {
    if (!value) return null;
    const parts = String(value).split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function toDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDateRange(start, end) {
    const startDate = parseLocalDate(start);
    const endDate = parseLocalDate(end);
    if (!startDate || !endDate) return "";
    const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
    return start === end ? formatter.format(startDate) : `${formatter.format(startDate)} to ${formatter.format(endDate)}`;
  }

  function setMessage(element, text, type) {
    element.textContent = text;
    element.className = `form-message ${type || ""}`.trim();
  }

  function toggleForm(form, disabled) {
    form.querySelectorAll("button, input, select, textarea").forEach((element) => {
      element.disabled = disabled;
    });
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
