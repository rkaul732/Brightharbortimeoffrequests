(function () {
  const statusLabels = {
    in_review: "Pending",
    approved: "Approved",
    denied: "Denied"
  };

  const statusValues = Object.keys(statusLabels);
  const demoKey = "bright-harbor-time-off-demo";
  const demoLoginKey = "bright-harbor-admin-login-history";
  const sessionKey = "bright-harbor-admin-session";
  const employeeSessionKey = "bright-harbor-employee-session";
  const demoEmployeeProfilesKey = "bright-harbor-employee-profiles";
  const workWeekKey = "bright-harbor-work-week";
  const brightHarborDomain = "@brightharbor.org";
  const superAdminEmail = "hr@brightharbor.org";
  const patternRequestThreshold = 3;
  const patternWindowDays = 42;
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const programOptions = [
    "Access",
    "ISC",
    "Outpatient",
    "Front Desk Professionals",
    "SOS",
    "Shore Haven",
    "Recovery",
    "Nursing Case Management",
    "On Point/Arrive Together",
    "ICM Blue"
  ];
  const programValues = new Set(programOptions);
  const reportTypes = [
    {
      type: "employee",
      title: "By Employee",
      summary: "Employee totals, decisions, pending requests, and average request lead time."
    },
    {
      type: "program",
      title: "By Program",
      summary: "Program totals, employee count, decisions, pending requests, and average request lead time."
    },
    {
      type: "detail",
      title: "Request Detail",
      summary: "Every submitted request with dates, status, program, department, and notes."
    }
  ];

  const sampleRequests = [
    {
      id: "demo-1",
      first_name: "Amara",
      last_name: "Bell",
      email: "amara.bell@brightharbor.org",
      department: "Client Services",
      program: "Access",
      manager: "Jordan Patel",
      time_off_type: "Vacation",
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
      email: "theo.choi@brightharbor.org",
      department: "Technology",
      program: "Recovery",
      manager: "Nina Ames",
      time_off_type: "Personal",
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
      email: "mina.rivera@brightharbor.org",
      department: "Harbor Operations",
      program: "Shore Haven",
      manager: "Sam Green",
      time_off_type: "Unpaid",
      start_date: "2026-10-01",
      end_date: "2026-10-02",
      partial_day: "Full days",
      business_days: 2,
      reason: "Out of town.",
      decision_note: "Blackout date overlap.",
      status: "denied",
      created_at: "2026-08-30T16:00:00.000Z",
      updated_at: "2026-09-02T12:10:00.000Z"
    },
    {
      id: "demo-4",
      first_name: "Jonah",
      last_name: "Fisk",
      email: "jonah.fisk@brightharbor.org",
      department: "Finance",
      program: "ICM Blue",
      manager: "Priya Shah",
      time_off_type: "Sick",
      start_date: "2026-09-09",
      end_date: "2026-09-09",
      partial_day: "Morning half day",
      business_days: 0.5,
      reason: "Medical visit.",
      decision_note: "",
      status: "in_review",
      created_at: "2026-09-08T12:40:00.000Z",
      updated_at: "2026-09-08T12:40:00.000Z"
    },
    {
      id: "demo-5",
      first_name: "Lena",
      last_name: "Hughes",
      email: "lena.hughes@brightharbor.org",
      department: "Human Resources",
      program: "Outpatient",
      manager: "Carla Wynn",
      time_off_type: "Vacation",
      start_date: "2026-09-28",
      end_date: "2026-09-30",
      partial_day: "Full days",
      business_days: 3,
      reason: "Long weekend.",
      decision_note: "Approved with desk coverage.",
      status: "approved",
      created_at: "2026-09-03T09:15:00.000Z",
      updated_at: "2026-09-04T15:10:00.000Z"
    },
    {
      id: "demo-6",
      first_name: "Amara",
      last_name: "Bell",
      email: "amara.bell@brightharbor.org",
      department: "Client Services",
      program: "Access",
      manager: "Jordan Patel",
      time_off_type: "Personal",
      start_date: "2026-09-21",
      end_date: "2026-09-21",
      partial_day: "Full days",
      business_days: 1,
      reason: "School closure.",
      decision_note: "Coverage confirmed.",
      status: "approved",
      created_at: "2026-09-05T13:05:00.000Z",
      updated_at: "2026-09-06T15:20:00.000Z"
    },
    {
      id: "demo-7",
      first_name: "Amara",
      last_name: "Bell",
      email: "amara.bell@brightharbor.org",
      department: "Client Services",
      program: "Access",
      manager: "Jordan Patel",
      time_off_type: "Sick",
      start_date: "2026-10-05",
      end_date: "2026-10-05",
      partial_day: "Full days",
      business_days: 1,
      reason: "Appointment.",
      decision_note: "",
      status: "in_review",
      created_at: "2026-09-25T08:45:00.000Z",
      updated_at: "2026-09-25T08:45:00.000Z"
    }
  ];

  const state = {
    requests: [],
    employeeLoadedRequests: [],
    adminAccounts: [],
    admin: null,
    employee: null,
    demoMode: false,
    employeeAuthMode: "signin",
    adminPage: "home",
    requestTab: "new_since_last",
    scheduleTab: "work_week",
    scheduleWeekDate: toDateInput(new Date()),
    scheduleMonthDate: toMonthInput(new Date()),
    reportStartDate: "",
    reportEndDate: "",
    workWeek: readWorkWeek()
  };

  const els = {
    employeeView: document.querySelector("#employee-view"),
    adminView: document.querySelector("#admin-view"),
    navLinks: document.querySelectorAll("[data-nav]"),
    employeeAuthPanel: document.querySelector("#employee-auth-panel"),
    employeeSigninForm: document.querySelector("#employee-signin-form"),
    employeeRegisterForm: document.querySelector("#employee-register-form"),
    employeeAuthMessage: document.querySelector("#employee-auth-message"),
    employeeWorkspace: document.querySelector("#employee-workspace"),
    employeeWelcome: document.querySelector("#employee-welcome"),
    employeeEmailLine: document.querySelector("#employee-email-line"),
    employeeSettingsButton: document.querySelector("#employee-settings-button"),
    employeeSettingsPanel: document.querySelector("#employee-settings-panel"),
    employeeSettingsClose: document.querySelector("#employee-settings-close"),
    employeeSignoutButton: document.querySelector("#employee-signout-button"),
    employeeProfileForm: document.querySelector("#employee-profile-form"),
    employeeProfileMessage: document.querySelector("#employee-profile-message"),
    popupAlert: document.querySelector("#popup-alert"),
    popupAlertMessage: document.querySelector("#popup-alert-message"),
    popupAlertClose: document.querySelector("#popup-alert-close"),
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
    adminTitle: document.querySelector("#admin-title"),
    adminRoleLine: document.querySelector("#admin-role-line"),
    adminHomePage: document.querySelector("#admin-home-page"),
    adminRequestsPage: document.querySelector("#admin-requests-page"),
    adminSchedulePage: document.querySelector("#admin-schedule-page"),
    adminReportsPage: document.querySelector("#admin-reports-page"),
    adminAccountsPage: document.querySelector("#admin-accounts-page"),
    adminSearch: document.querySelector("#admin-search"),
    adminNewCount: document.querySelector("#admin-new-count"),
    adminPendingCount: document.querySelector("#admin-pending-count"),
    adminApprovedCount: document.querySelector("#admin-approved-count"),
    adminDeniedCount: document.querySelector("#admin-denied-count"),
    requestTabContent: document.querySelector("#request-tab-content"),
    scheduleControls: document.querySelector("#schedule-controls"),
    scheduleTabContent: document.querySelector("#schedule-tab-content"),
    reportsContent: document.querySelector("#reports-content"),
    accountsContent: document.querySelector("#accounts-content"),
    accountsMessage: document.querySelector("#accounts-message")
  };

  init();

  async function init() {
    state.admin = readSession();
    state.employee = readEmployeeSession();

    bindEvents();
    await hydrate();
    route();
  }

  function bindEvents() {
    window.addEventListener("hashchange", route);

    els.employeeAuthPanel.addEventListener("click", (event) => {
      const modeButton = event.target.closest("[data-employee-auth-mode]");
      if (!modeButton) return;
      state.employeeAuthMode = modeButton.dataset.employeeAuthMode;
      setMessage(els.employeeAuthMessage, "", "");
      renderEmployeeAuth();
    });

    els.employeeSigninForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await loginEmployee(new FormData(els.employeeSigninForm));
    });

    els.employeeRegisterForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await registerEmployee(new FormData(els.employeeRegisterForm));
    });

    els.employeeSignoutButton.addEventListener("click", () => {
      logoutEmployee();
    });

    els.employeeSettingsButton.addEventListener("click", () => {
      openEmployeeSettings();
    });

    els.employeeSettingsClose.addEventListener("click", () => {
      closeEmployeeSettings();
    });

    els.employeeSettingsPanel.addEventListener("click", (event) => {
      if (event.target === els.employeeSettingsPanel) closeEmployeeSettings();
    });

    els.employeeProfileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await saveEmployeeProfile(new FormData(els.employeeProfileForm));
    });

    els.popupAlertClose.addEventListener("click", hidePopup);

    els.popupAlert.addEventListener("click", (event) => {
      if (event.target === els.popupAlert) hidePopup();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.popupAlert.hidden) hidePopup();
      if (event.key === "Escape" && !els.employeeSettingsPanel.hidden) closeEmployeeSettings();
    });

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
      state.adminAccounts = [];
      state.adminPage = "home";
      sessionStorage.removeItem(sessionKey);
      renderAdmin();
    });

    els.adminPanel.addEventListener("click", async (event) => {
      const pageButton = event.target.closest("[data-admin-page]");
      if (pageButton) {
        const nextPage = pageButton.dataset.adminPage;
        if (nextPage === "accounts" && !isSuperAdmin()) {
          setMessage(els.accountsMessage, "Only the super admin can manage account types.", "error");
          return;
        }
        state.adminPage = nextPage;
        if (nextPage === "accounts") {
          try {
            await loadAdminAccounts();
            setMessage(els.accountsMessage, "", "");
          } catch (error) {
            setMessage(els.accountsMessage, error.message || "Could not load account types.", "error");
          }
        }
        renderAdmin();
        return;
      }

      const requestTab = event.target.closest("[data-request-tab]");
      if (requestTab) {
        state.requestTab = requestTab.dataset.requestTab;
        renderRequestsPage();
        return;
      }

      const scheduleTab = event.target.closest("[data-schedule-tab]");
      if (scheduleTab) {
        state.scheduleTab = scheduleTab.dataset.scheduleTab;
        renderSchedulePage();
        return;
      }

      const reportButton = event.target.closest("[data-download-report]");
      if (reportButton) {
        handleReportDownload(reportButton.dataset.downloadReport);
        return;
      }

      const accountTypeButton = event.target.closest("[data-save-account-type]");
      if (accountTypeButton) {
        await handleAccountTypeSave(accountTypeButton);
        return;
      }

      const saveButton = event.target.closest("[data-save-status]");
      if (saveButton) {
        await handleStatusSave(saveButton);
        return;
      }

      const rescindButton = event.target.closest("[data-rescind-approval]");
      if (rescindButton) {
        await handleRescindApproval(rescindButton);
      }
    });

    els.adminPanel.addEventListener("change", (event) => {
      const reportControl = event.target.closest("[data-report-control]");
      if (reportControl) {
        if (reportControl.dataset.reportControl === "startDate") {
          state.reportStartDate = reportControl.value;
        }
        if (reportControl.dataset.reportControl === "endDate") {
          state.reportEndDate = reportControl.value;
        }
        renderReportsPage();
        return;
      }

      const control = event.target.closest("[data-schedule-control]");
      if (!control) return;

      if (control.dataset.scheduleControl === "weekStart") {
        state.workWeek.startDay = Number(control.value);
        writeWorkWeek(state.workWeek);
      }
      if (control.dataset.scheduleControl === "weekLength") {
        state.workWeek.length = Number(control.value);
        writeWorkWeek(state.workWeek);
      }
      if (control.dataset.scheduleControl === "weekDate") {
        state.scheduleWeekDate = control.value || toDateInput(new Date());
      }
      if (control.dataset.scheduleControl === "monthDate") {
        state.scheduleMonthDate = control.value || toMonthInput(new Date());
      }
      renderSchedulePage();
    });

    els.adminSearch.addEventListener("input", renderRequestsPage);
  }

  async function hydrate() {
    state.demoMode = !(await isBackendReady());
    if (state.demoMode) {
      state.requests = readDemoRequests();
    } else {
      state.requests = [];
      if (state.employee) {
        try {
          await loadEmployeeAccount();
        } catch (error) {
          state.employee = null;
          sessionStorage.removeItem(employeeSessionKey);
          setMessage(els.employeeAuthMessage, error.message || "Please sign in again.", "error");
        }
      }
      if (state.admin) {
        try {
          await loadAdminRequests();
          if (isSuperAdmin()) {
            try {
              await loadAdminAccounts();
            } catch (error) {
              setMessage(els.accountsMessage, error.message || "Could not load account types.", "error");
            }
          }
        } catch (error) {
          setMessage(els.loginMessage, error.message || "Please sign in again.", "error");
        }
      }
    }
    renderEmployee();
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
      renderEmployee();
    }
  }

  async function submitRequest(formData) {
    if (!state.employee) {
      setMessage(els.requestMessage, "Sign in with your Bright Harbor account before submitting a request.", "error");
      return;
    }

    const profile = state.employee.profile || {};
    const payload = {
      employee_user_id: state.employee.id || "",
      first_name: clean(profile.first_name) || clean(formData.get("firstName")),
      last_name: clean(profile.last_name) || clean(formData.get("lastName")),
      email: clean(state.employee.email || profile.email || formData.get("email")).toLowerCase(),
      department: clean(formData.get("department")),
      program: clean(profile.program) || clean(formData.get("program")),
      manager: clean(profile.manager) || clean(formData.get("manager")),
      time_off_type: timeOffTypeLabel(formData.get("timeOffType")),
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
      if (state.demoMode || state.admin) {
        state.requests = upsertRequest(saved, state.requests);
      }
      if (!state.demoMode) {
        state.employeeLoadedRequests = upsertRequest(saved, state.employeeLoadedRequests);
      }
      els.requestForm.reset();
      syncRequestProfileFields();
      updateBusinessDayOutput();
      renderAll();
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
      headers: {
        authorization: `Bearer ${state.employee.token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || "Could not submit the request.");
    }
    return normalizeRequest(body.request);
  }

  async function registerEmployee(formData) {
    const email = clean(formData.get("email")).toLowerCase();
    const password = String(formData.get("password") || "");
    const profile = {
      first_name: clean(formData.get("firstName")),
      last_name: clean(formData.get("lastName")),
      pronouns: clean(formData.get("pronouns")),
      program: clean(formData.get("program")),
      manager: clean(formData.get("manager"))
    };

    if (!isBrightHarborEmail(email)) {
      showBrightHarborEmailError();
      return;
    }
    if (password.length < 8) {
      setMessage(els.employeeAuthMessage, "Choose a password with at least 8 characters.", "error");
      return;
    }
    if (missingProfileDetails(profile)) {
      setMessage(els.employeeAuthMessage, "Complete your name, program, and manager.", "error");
      return;
    }
    if (!isAllowedProgram(profile.program)) {
      setMessage(els.employeeAuthMessage, "Choose a valid program.", "error");
      return;
    }

    toggleForm(els.employeeRegisterForm, true);
    setMessage(els.employeeAuthMessage, "Creating account...", "");

    try {
      const employee = state.demoMode
        ? registerDemoEmployee(email, profile)
        : await createRemoteEmployeeAccount({ email, password, ...profile });
      state.employee = employee;
      writeEmployeeSession(employee);
      await loadEmployeeRequestsForSession();
      els.employeeRegisterForm.reset();
      setMessage(els.employeeAuthMessage, "", "");
      renderAll();
    } catch (error) {
      setMessage(els.employeeAuthMessage, error.message || "Could not create account.", "error");
    } finally {
      toggleForm(els.employeeRegisterForm, false);
    }
  }

  async function loginEmployee(formData) {
    const email = clean(formData.get("email")).toLowerCase();
    const password = String(formData.get("password") || "");

    if (!isBrightHarborEmail(email)) {
      showBrightHarborEmailError();
      return;
    }
    if (!password) {
      setMessage(els.employeeAuthMessage, "Enter your password.", "error");
      return;
    }

    toggleForm(els.employeeSigninForm, true);
    setMessage(els.employeeAuthMessage, "Signing in...", "");

    try {
      const employee = state.demoMode ? loginDemoEmployee(email) : await loginRemoteEmployee({ email, password });
      state.employee = employee;
      writeEmployeeSession(employee);
      await loadEmployeeRequestsForSession();
      els.employeeSigninForm.reset();
      setMessage(els.employeeAuthMessage, "", "");
      renderAll();
    } catch (error) {
      setMessage(els.employeeAuthMessage, error.message || "Sign in failed.", "error");
    } finally {
      toggleForm(els.employeeSigninForm, false);
    }
  }

  function logoutEmployee() {
    state.employee = null;
    state.employeeLoadedRequests = [];
    sessionStorage.removeItem(employeeSessionKey);
    closeEmployeeSettings();
    setMessage(els.employeeProfileMessage, "", "");
    setMessage(els.requestMessage, "", "");
    renderAll();
  }

  async function saveEmployeeProfile(formData) {
    if (!state.employee) return;

    const profile = {
      first_name: clean(formData.get("firstName")),
      last_name: clean(formData.get("lastName")),
      pronouns: clean(formData.get("pronouns")),
      program: clean(formData.get("program")),
      manager: clean(formData.get("manager"))
    };

    if (missingProfileDetails(profile)) {
      setMessage(els.employeeProfileMessage, "Complete your name, program, and manager.", "error");
      return;
    }
    if (!isAllowedProgram(profile.program)) {
      setMessage(els.employeeProfileMessage, "Choose a valid program.", "error");
      return;
    }

    toggleForm(els.employeeProfileForm, true);
    setMessage(els.employeeProfileMessage, "Saving profile...", "");

    try {
      const saved = state.demoMode ? saveDemoEmployeeProfile(profile) : await updateRemoteEmployeeProfile(profile);
      state.employee.profile = saved;
      writeEmployeeSession(state.employee);
      syncRequestProfileFields();
      renderEmployee();
      setMessage(els.employeeProfileMessage, "Profile saved.", "success");
    } catch (error) {
      setMessage(els.employeeProfileMessage, error.message || "Could not save profile.", "error");
    } finally {
      toggleForm(els.employeeProfileForm, false);
    }
  }

  async function createRemoteEmployeeAccount(payload) {
    const response = await fetch("/.netlify/functions/employee-register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    return employeeFromResponse(response, "Could not create account.");
  }

  async function loginRemoteEmployee(payload) {
    const response = await fetch("/.netlify/functions/employee-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    return employeeFromResponse(response, "Sign in failed.");
  }

  async function updateRemoteEmployeeProfile(profile) {
    const response = await fetch("/.netlify/functions/employee-profile", {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${state.employee.token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(profile)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || "Could not save profile.");
    }
    return normalizeProfile(body.profile, state.employee);
  }

  async function loadEmployeeAccount() {
    if (!state.employee || state.demoMode) return;

    const profileResponse = await fetch("/.netlify/functions/employee-profile", {
      headers: { authorization: `Bearer ${state.employee.token}` }
    });
    const profileBody = await profileResponse.json().catch(() => ({}));
    if (!profileResponse.ok) {
      throw new Error(profileBody.error || "Could not load employee profile.");
    }
    state.employee.profile = normalizeProfile(profileBody.profile, state.employee);
    writeEmployeeSession(state.employee);

    await loadEmployeeRequestsForSession();
  }

  async function loadEmployeeRequestsForSession() {
    if (!state.employee) return;
    if (state.demoMode) {
      state.requests = readDemoRequests();
      return;
    }

    const response = await fetch("/.netlify/functions/employee-requests", {
      headers: { authorization: `Bearer ${state.employee.token}` }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || "Could not load your requests.");
    }
    state.employeeLoadedRequests = (body.requests || []).map(normalizeRequest);
  }

  async function employeeFromResponse(response, fallbackMessage) {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || fallbackMessage);
    }
    return {
      id: body.id || body.profile?.id || "",
      email: clean(body.email || body.profile?.email).toLowerCase(),
      token: body.accessToken,
      refreshToken: body.refreshToken || "",
      profile: normalizeProfile(body.profile, body)
    };
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
        const currentSignInAt = new Date().toISOString();
        const superAdmin = isSuperAdminEmail(email);
        state.admin = {
          email,
          name: deriveAdminName(email),
          token: "demo-token",
          role: superAdmin ? "super_admin" : "admin",
          accountType: superAdmin ? "super_admin" : "admin",
          isSuperAdmin: superAdmin,
          previousSignInAt: readDemoLastSignIn(email),
          currentSignInAt
        };
        writeDemoLastSignIn(email, currentSignInAt);
        if (superAdmin) state.adminAccounts = demoAdminAccounts();
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
        state.admin = {
          email: body.email,
          name: body.name || deriveAdminName(body.email),
          token: body.accessToken,
          role: body.role || "admin",
          accountType: body.accountType || "admin",
          isSuperAdmin: Boolean(body.isSuperAdmin) || isSuperAdminEmail(body.email),
          previousSignInAt: body.previousSignInAt || null,
          currentSignInAt: body.currentSignInAt || new Date().toISOString()
        };
        await loadAdminRequests();
        if (isSuperAdmin()) {
          try {
            await loadAdminAccounts();
          } catch (error) {
            setMessage(els.accountsMessage, error.message || "Could not load account types.", "error");
          }
        }
      }
      state.adminPage = "home";
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

  async function loadAdminAccounts() {
    if (!state.admin || !isSuperAdmin()) {
      state.adminAccounts = [];
      return;
    }

    if (state.demoMode) {
      state.adminAccounts = demoAdminAccounts();
      return;
    }

    const response = await fetch("/.netlify/functions/admin-accounts", {
      headers: { authorization: `Bearer ${state.admin.token}` }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || "Could not load account types.");
    }
    state.adminAccounts = sortAccounts((body.accounts || []).map(normalizeAccount));
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

  async function updateAccountType(id, accountType) {
    if (!["employee", "admin"].includes(accountType)) return;

    if (state.demoMode) {
      state.adminAccounts = sortAccounts(
        state.adminAccounts.map((account) =>
          account.id === id ? { ...account, account_type: accountType, updated_at: new Date().toISOString() } : account
        )
      );
      renderAccountsPage();
      return;
    }

    const response = await fetch("/.netlify/functions/admin-update-account", {
      method: "POST",
      headers: {
        authorization: `Bearer ${state.admin.token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ id, account_type: accountType })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || "Could not update account type.");
    }
    state.adminAccounts = upsertAccount(normalizeAccount(body.account), state.adminAccounts);
    renderAccountsPage();
  }

  async function handleStatusSave(button) {
    const id = button.dataset.saveStatus;
    const wrapper = button.closest("[data-request-row]");
    const select = wrapper.querySelector("[data-status-select]");
    const note = wrapper.querySelector("[data-decision-note]");
    const originalText = button.textContent;

    button.disabled = true;
    button.textContent = "Saving...";
    try {
      await updateStatus(id, select.value, note.value.trim());
    } catch (error) {
      button.disabled = false;
      button.textContent = originalText;
      alert(error.message || "Could not save this update.");
    }
  }

  async function handleRescindApproval(button) {
    const id = button.dataset.rescindApproval;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Rescinding...";
    try {
      await updateStatus(id, "in_review", "Approval rescinded.");
    } catch (error) {
      button.disabled = false;
      button.textContent = originalText;
      alert(error.message || "Could not rescind this approval.");
    }
  }

  async function handleAccountTypeSave(button) {
    const id = button.dataset.saveAccountType;
    const wrapper = button.closest("[data-account-row]");
    const select = wrapper.querySelector("[data-account-type-select]");
    const originalText = button.textContent;

    button.disabled = true;
    button.textContent = "Saving...";
    setMessage(els.accountsMessage, "Saving account type...", "");
    try {
      await updateAccountType(id, select.value);
      setMessage(els.accountsMessage, "Account type updated.", "success");
    } catch (error) {
      setMessage(els.accountsMessage, error.message || "Could not update account type.", "error");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  function renderAll() {
    renderEmployee();
    renderAdmin();
  }

  function renderEmployee() {
    const signedIn = Boolean(state.employee);
    els.employeeAuthPanel.hidden = signedIn;
    els.employeeWorkspace.hidden = !signedIn;
    if (!signedIn) closeEmployeeSettings();

    renderEmployeeAuth();

    if (!signedIn) {
      els.queueTotal.textContent = "0";
      els.queueReview.textContent = "0";
      els.queueApproved.textContent = "0";
      els.employeeRequestList.innerHTML = `<div class="empty-state">Sign in to view your requests.</div>`;
      return;
    }

    const profile = state.employee.profile || {};
    els.employeeWelcome.textContent = `Welcome, ${employeeDisplayName()}!`;
    els.employeeEmailLine.textContent = state.employee.email || profile.email || "";
    syncEmployeeProfileForm();
    syncRequestProfileFields();
    renderEmployeeSettings();
    renderEmployeeSummary();
  }

  function openEmployeeSettings() {
    if (!state.employee) return;
    syncEmployeeProfileForm();
    setMessage(els.employeeProfileMessage, "", "");
    els.employeeSettingsPanel.hidden = false;
    els.employeeProfileForm.elements.firstName.focus();
  }

  function closeEmployeeSettings() {
    els.employeeSettingsPanel.hidden = true;
  }

  function renderEmployeeSettings() {
    if (!state.employee) {
      els.employeeSettingsPanel.hidden = true;
    }
  }

  function renderEmployeeAuth() {
    els.employeeAuthPanel.querySelectorAll("[data-employee-auth-mode]").forEach((button) => {
      const active = button.dataset.employeeAuthMode === state.employeeAuthMode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });

    els.employeeSigninForm.hidden = state.employeeAuthMode !== "signin";
    els.employeeRegisterForm.hidden = state.employeeAuthMode !== "register";
  }

  function renderEmployeeSummary() {
    const requests = employeeRequests();
    const sorted = alphabetize(requests).slice(0, 6);
    const counts = countStatuses(requests);
    els.queueTotal.textContent = requests.length;
    els.queueReview.textContent = counts.in_review;
    els.queueApproved.textContent = counts.approved;
    els.employeeRequestList.innerHTML = sorted.length
      ? sorted.map((request) => requestCard(request, false)).join("")
      : `<div class="empty-state">No requests yet.</div>`;
  }

  function renderAdmin() {
    const signedIn = Boolean(state.admin);
    els.loginPanel.hidden = signedIn;
    els.adminPanel.hidden = !signedIn;

    if (!signedIn) return;

    const titles = {
      home: `Welcome, ${adminDisplayName()}!`,
      requests: "New Requests",
      schedule: "Team Schedule",
      reports: "Reports",
      accounts: "Account Types"
    };
    if (state.adminPage === "accounts" && !isSuperAdmin()) {
      state.adminPage = "home";
    }
    els.adminTitle.textContent = titles[state.adminPage] || titles.home;
    els.adminRoleLine.textContent = isSuperAdmin() ? "Super Admin" : "Admin";

    showAdminPage(state.adminPage);
  }

  function showAdminPage(page) {
    const pages = {
      home: els.adminHomePage,
      requests: els.adminRequestsPage,
      schedule: els.adminSchedulePage,
      reports: els.adminReportsPage,
      accounts: els.adminAccountsPage
    };

    Object.entries(pages).forEach(([name, element]) => {
      element.hidden = name !== page;
    });

    if (page === "home") renderHomePage();
    if (page === "requests") renderRequestsPage();
    if (page === "schedule") renderSchedulePage();
    if (page === "reports") renderReportsPage();
    if (page === "accounts") renderAccountsPage();
  }

  function renderHomePage() {
    const counts = countStatuses(state.requests);
    const newCount = newSinceLastSignOn(state.requests).length;
    els.adminNewCount.textContent = newCount;
    els.adminPendingCount.textContent = counts.in_review;
    els.adminApprovedCount.textContent = counts.approved;
    els.adminDeniedCount.textContent = counts.denied;

    setHubCount("requests", `${counts.in_review} waiting`);
    setHubCount("schedule", `${counts.approved} approved`);
    setHubCount("reports", `${reportTypes.length} downloads`);
    setHubCount("accounts", `${state.adminAccounts.length || 0} accounts`);

    els.adminHomePage.querySelectorAll("[data-super-admin-only]").forEach((element) => {
      element.hidden = !isSuperAdmin();
    });
  }

  function renderRequestsPage() {
    const filtered = filterRequests(state.requests, els.adminSearch.value);
    const requests = requestTabItems(filtered);
    const lastSignOn = state.admin?.previousSignInAt ? formatDateTime(state.admin.previousSignInAt) : "First sign on";
    const requestContent = state.requestTab === "completed"
      ? completedRequestColumns(filtered)
      : requestTable(requests, "No requests in this tab.");

    els.adminPanel.querySelectorAll("[data-request-tab]").forEach((button) => {
      const active = button.dataset.requestTab === state.requestTab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });

    els.requestTabContent.innerHTML = `
      <div class="tab-heading">
        <h3>${requestTabTitle()}</h3>
        <span class="meta-line">Last sign on: ${escapeHtml(lastSignOn)}</span>
      </div>
      ${requestContent}
    `;
  }

  function renderSchedulePage() {
    const approved = approvedRequests();

    els.adminPanel.querySelectorAll("[data-schedule-tab]").forEach((button) => {
      const active = button.dataset.scheduleTab === state.scheduleTab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });

    if (state.scheduleTab === "work_week") {
      renderWorkWeek(approved);
      return;
    }

    if (state.scheduleTab === "month") {
      renderScheduleMonth(approved);
      return;
    }

    renderScheduleByEmployee(approved);
  }

  function renderWorkWeek(approved) {
    const focus = parseLocalDate(state.scheduleWeekDate) || new Date();
    const cells = workWeekCells(focus);
    const start = cells[0].date;
    const end = cells[cells.length - 1].date;

    els.scheduleControls.hidden = false;
    els.scheduleControls.innerHTML = `
      <label>
        <span>Week includes</span>
        <input type="date" value="${escapeHtml(state.scheduleWeekDate)}" data-schedule-control="weekDate" />
      </label>
      <label>
        <span>Default work week starts</span>
        <select data-schedule-control="weekStart">
          ${dayNames.map((day, index) => `<option value="${index}" ${state.workWeek.startDay === index ? "selected" : ""}>${day}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>Work days</span>
        <select data-schedule-control="weekLength">
          ${[5, 6, 7].map((length) => `<option value="${length}" ${state.workWeek.length === length ? "selected" : ""}>${length} days</option>`).join("")}
        </select>
      </label>
    `;

    els.scheduleTabContent.innerHTML = `
      <div class="tab-heading">
        <h3>${formatDateRange(toDateInput(start), toDateInput(end))}</h3>
        <span class="meta-line">${approved.length} approved requests</span>
      </div>
      <div class="calendar-grid workweek workweek-${cells.length}">
        ${cells.map((cell) => scheduleCalendarCell(cell, approved, true)).join("")}
      </div>
    `;
  }

  function renderScheduleMonth(approved) {
    const focus = parseMonthInput(state.scheduleMonthDate) || new Date();
    const cells = monthCells(focus);

    els.scheduleControls.hidden = false;
    els.scheduleControls.innerHTML = `
      <label>
        <span>Month</span>
        <input type="month" value="${escapeHtml(state.scheduleMonthDate)}" data-schedule-control="monthDate" />
      </label>
    `;

    els.scheduleTabContent.innerHTML = `
      <div class="tab-heading">
        <h3>${focus.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h3>
        <span class="meta-line">${approved.length} approved requests</span>
      </div>
      <div class="calendar-grid month">
        ${weekdayHeader()}
        ${cells.map((cell) => scheduleCalendarCell(cell, approved, false)).join("")}
      </div>
    `;
  }

  function renderScheduleByEmployee(approved) {
    const groups = groupApprovedByEmployee(approved);
    els.scheduleControls.hidden = true;
    els.scheduleControls.innerHTML = "";

    els.scheduleTabContent.innerHTML = groups.length
      ? `<div class="employee-approval-list">${groups.map(employeeApprovalGroup).join("")}</div>`
      : `<div class="empty-state">No approved time off yet.</div>`;
  }

  function renderReportsPage() {
    ensureReportDateRange();
    const range = currentReportDateRange();
    const matchingRequests = range.valid ? reportActivityRequests(range) : [];

    els.reportsContent.innerHTML = `
      <div class="toolbar report-range-toolbar" aria-label="Report date range">
        <label>
          <span>Date Range</span>
          <input type="date" value="${escapeHtml(state.reportStartDate)}" data-report-control="startDate" />
        </label>
        <label>
          <span>End date</span>
          <input type="date" value="${escapeHtml(state.reportEndDate)}" data-report-control="endDate" />
        </label>
      </div>
      <div class="tab-heading">
        <h3>Available Downloads</h3>
        <span class="meta-line">${escapeHtml(reportRangeSummary(range, matchingRequests.length))}</span>
      </div>
      ${range.valid ? "" : `<div class="empty-state">Choose an end date that is the same as or after the start date.</div>`}
      <div class="report-grid">
        ${reportTypes.map((report) => reportCard(report, range.valid)).join("")}
      </div>
    `;
  }

  function renderAccountsPage() {
    if (!isSuperAdmin()) {
      els.accountsContent.innerHTML = `<div class="empty-state">Only the super admin can manage account types.</div>`;
      return;
    }

    const accounts = sortAccounts(state.adminAccounts);
    els.accountsContent.innerHTML = accounts.length
      ? `
        <div class="tab-heading">
          <h3>Employee And Admin Accounts</h3>
          <span class="meta-line">${accounts.length} ${accounts.length === 1 ? "account" : "accounts"}</span>
        </div>
        <div class="account-type-table">
          ${accountTypeHeader()}
          ${accounts.map(accountTypeLine).join("")}
        </div>
      `
      : `<div class="empty-state">No employee accounts have been created yet.</div>`;
  }

  function accountTypeHeader() {
    return `
      <div class="account-type-header" aria-hidden="true">
        <span>Person</span>
        <span>Program</span>
        <span>Manager</span>
        <span>Account Type</span>
        <span>Action</span>
      </div>
    `;
  }

  function accountTypeLine(account) {
    const superAdmin = account.is_super_admin || isSuperAdminEmail(account.email);
    return `
      <article class="account-type-line" data-account-row="${escapeHtml(account.id)}">
        <div class="request-line-main">
          <strong>${escapeHtml(accountName(account))}</strong>
          <small>${escapeHtml(account.email)}</small>
        </div>
        <div>
          <span class="table-label">Program</span>
          <span>${escapeHtml(account.program || "Unassigned")}</span>
        </div>
        <div>
          <span class="table-label">Manager</span>
          <span>${escapeHtml(account.manager || "Unassigned")}</span>
        </div>
        <div class="account-type-control">
          <span class="table-label">Account Type</span>
          ${
            superAdmin
              ? `<span class="account-type-pill super_admin">Super Admin</span>`
              : `
                <select aria-label="Account type for ${escapeHtml(accountName(account))}" data-account-type-select>
                  <option value="employee" ${account.account_type === "employee" ? "selected" : ""}>Employee</option>
                  <option value="admin" ${account.account_type === "admin" ? "selected" : ""}>Admin</option>
                </select>
              `
          }
        </div>
        <div>
          <span class="table-label">Action</span>
          ${
            superAdmin
              ? `<span class="meta-line">Protected</span>`
              : `<button class="status-save" type="button" data-save-account-type="${escapeHtml(account.id)}">Save</button>`
          }
        </div>
      </article>
    `;
  }

  function requestTabItems(requests) {
    if (state.requestTab === "new_since_last") {
      return newSinceLastSignOn(requests);
    }
    if (state.requestTab === "still_pending") {
      return sortBySubmitted(requests.filter((request) => request.status === "in_review"));
    }
    return sortBySubmitted(requests.filter((request) => request.status === "approved" || request.status === "denied"));
  }

  function requestTabTitle() {
    if (state.requestTab === "new_since_last") return "New Since Last Sign On";
    if (state.requestTab === "still_pending") return "Still Pending";
    return "Approved or Denied";
  }

  function requestTable(requests, emptyText) {
    return requests.length
      ? `<div class="request-table">${requestTableHeader()}${requests.map(requestLine).join("")}</div>`
      : `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
  }

  function requestTableHeader() {
    return `
      <div class="request-table-header" aria-hidden="true">
        <span>Employee</span>
        <span>Requested Off</span>
        <span>Submitted</span>
        <span>Status</span>
        <span>Admin Update</span>
      </div>
    `;
  }

  function completedRequestColumns(requests) {
    const approved = sortBySubmitted(requests.filter((request) => request.status === "approved"));
    const denied = sortBySubmitted(requests.filter((request) => request.status === "denied"));

    if (!approved.length && !denied.length) {
      return `<div class="empty-state">No approved or denied requests yet.</div>`;
    }

    return `
      <div class="completed-request-columns">
        ${completedRequestColumn("approved", "Approved", approved)}
        ${completedRequestColumn("denied", "Denied", denied)}
      </div>
    `;
  }

  function completedRequestColumn(status, title, requests) {
    return `
      <section class="completed-request-column ${status}" aria-label="${escapeHtml(title)} requests">
        <div class="completed-column-heading ${status}">
          <h3>${escapeHtml(title)}</h3>
          <span>${requests.length} ${requests.length === 1 ? "request" : "requests"}</span>
        </div>
        ${requestTable(requests, `No ${title.toLowerCase()} requests yet.`)}
      </section>
    `;
  }

  function requestLine(request) {
    const submitted = formatDateTime(request.created_at);
    const flag = patternFlagForRequest(request);
    return `
      <article class="request-line" data-request-row>
        <div class="request-line-main">
          <strong class="name-with-flag">${escapeHtml(employeeName(request))}${patternFlagBadge(flag)}</strong>
          <small>${escapeHtml(programName(request))} - ${escapeHtml(request.department)} - ${escapeHtml(request.email)}</small>
        </div>
        <div>
          <span class="table-label">Requested off</span>
          <span>${formatDateRange(request.start_date, request.end_date)}</span>
        </div>
        <div>
          <span class="table-label">Submitted</span>
          <span>${escapeHtml(submitted)}</span>
        </div>
        <div class="status-cell">
          <span class="table-label">Status</span>
          <button class="status-button ${request.status}" type="button">${statusLabels[request.status]}</button>
        </div>
        <div class="inline-decision">
          <span class="table-label">Admin Update</span>
          <select aria-label="Approval type for ${escapeHtml(request.first_name)} ${escapeHtml(request.last_name)}" data-status-select>
            ${statusValues.map((status) => `<option value="${status}" ${request.status === status ? "selected" : ""}>${statusLabels[status]}</option>`).join("")}
          </select>
          <input aria-label="Decision note" value="${escapeHtml(request.decision_note || "")}" placeholder="Decision note" data-decision-note />
          <button class="status-save" type="button" data-save-status="${escapeHtml(request.id)}">Save</button>
        </div>
      </article>
    `;
  }

  function requestCard(request, detailed) {
    const name = employeeName(request);
    const flag = patternFlagForRequest(request);
    return `
      <article class="request-row ${request.status}">
        <header>
          <div>
            <strong class="name-with-flag">${escapeHtml(name)}${patternFlagBadge(flag)}</strong>
            <small>${escapeHtml(programName(request))} - ${escapeHtml(request.department)} - ${escapeHtml(request.time_off_type)}</small>
          </div>
          <span class="status-pill ${request.status}">${statusLabels[request.status]}</span>
        </header>
        <div class="meta-line">${formatDateRange(request.start_date, request.end_date)} - ${request.business_days} business ${request.business_days === 1 ? "day" : "days"}</div>
        <div class="meta-line">Submitted: ${escapeHtml(formatDateTime(request.created_at))}</div>
        ${detailed ? `<div class="meta-line">${escapeHtml(request.email)} - Manager: ${escapeHtml(request.manager)}</div>` : ""}
        ${request.reason ? `<p>${escapeHtml(request.reason)}</p>` : ""}
        ${detailed && request.decision_note ? `<div class="meta-line">Decision note: ${escapeHtml(request.decision_note)}</div>` : ""}
      </article>
    `;
  }

  function scheduleCalendarCell(cell, requests, includeWeekday) {
    const matching = alphabetize(requests.filter((request) => overlapsDate(request, cell.date)));
    const label = includeWeekday
      ? cell.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
      : cell.label;

    return `
      <div class="calendar-cell ${cell.muted ? "muted" : ""}">
        <time datetime="${cell.iso}">${escapeHtml(label)}</time>
        ${matching.length ? matching.map(scheduleCalendarItem).join("") : ""}
      </div>
    `;
  }

  function scheduleCalendarItem(request) {
    const flag = patternFlagForRequest(request);
    return `
      <span class="calendar-request approved">
        <strong class="name-with-flag">${escapeHtml(employeeName(request))}${patternFlagBadge(flag)}</strong>
        ${escapeHtml(programName(request))} - ${escapeHtml(request.time_off_type)}
      </span>
    `;
  }

  function employeeApprovalGroup(group) {
    return `
      <article class="employee-approval-group">
        <div>
          <strong class="name-with-flag">${escapeHtml(group.name)}${patternFlagBadge(group.flag)}</strong>
          <small>${escapeHtml(group.program)} - ${escapeHtml(group.department)}</small>
        </div>
        <div class="approval-dates">
          ${group.requests.map(approvalDateRow).join("")}
        </div>
      </article>
    `;
  }

  function approvalDateRow(request) {
    return `
      <div class="approval-date-row">
        <span>${formatDateRange(request.start_date, request.end_date)}</span>
        <button class="rescind-button" type="button" data-rescind-approval="${escapeHtml(request.id)}">
          <span aria-hidden="true">&#9995;</span> RESCIND APPROVAL
        </button>
      </div>
    `;
  }

  function reportCard(report, canDownload) {
    return `
      <article class="report-card">
        <div>
          <strong>${escapeHtml(report.title)}</strong>
          <small>${escapeHtml(report.summary)}</small>
        </div>
        <button class="report-download-button" type="button" data-download-report="${escapeHtml(report.type)}" ${canDownload ? "" : "disabled"}>Download CSV</button>
      </article>
    `;
  }

  function handleReportDownload(type) {
    const report = reportTypes.find((item) => item.type === type);
    if (!report) return;
    const range = currentReportDateRange();
    if (!range.valid) {
      alert("Choose an end date that is the same as or after the start date.");
      return;
    }

    const rows = {
      employee: employeeReportRows,
      program: programReportRows,
      detail: detailReportRows
    }[type](range);

    downloadCsv(`${slugify(report.title)}-${state.reportStartDate}-to-${state.reportEndDate}.csv`, rows);
  }

  function employeeReportRows(range) {
    const rows = [
      [
        "Employee Name",
        "Pattern Flag",
        "Pattern Details",
        "Email",
        "Program(s)",
        "Requests Submitted",
        "Approved During Date Range",
        "Denied During Date Range",
        "Unanswered Pending Requests",
        "Average Request Lead Time (Days)"
      ]
    ];
    const groups = new Map();
    const flags = patternFlags();

    state.requests.forEach((request) => {
      const activity = reportActivityForRequest(request, range);
      if (!activity.submitted && !activity.approved && !activity.denied && !activity.pending) return;

      const key = employeeKey(request);
      if (!groups.has(key)) {
        groups.set(key, {
          name: employeeName(request),
          flag: flags.get(key),
          email: request.email,
          programs: new Set(),
          leadTimes: [],
          total: 0,
          approved: 0,
          denied: 0,
          in_review: 0
        });
      }

      const group = groups.get(key);
      group.programs.add(programName(request));
      if (activity.submitted) group.total += 1;
      if (activity.approved) group.approved += 1;
      if (activity.denied) group.denied += 1;
      if (activity.pending) group.in_review += 1;
      const leadTime = requestLeadTimeDays(request);
      if (activity.submitted && leadTime !== null) group.leadTimes.push(leadTime);
    });

    return rows.concat(
      Array.from(groups.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((group) => [
          group.name,
          group.flag ? "Yes" : "No",
          group.flag?.description || "",
          group.email,
          Array.from(group.programs).sort().join("; "),
          group.total,
          group.approved,
          group.denied,
          group.in_review,
          average(group.leadTimes)
        ])
    );
  }

  function programReportRows(range) {
    const rows = [
      [
        "Program",
        "Employees With Pattern Flags",
        "Employees",
        "Requests Submitted",
        "Approved During Date Range",
        "Denied During Date Range",
        "Unanswered Pending Requests",
        "Average Request Lead Time (Days)"
      ]
    ];
    const groups = new Map();
    const flags = patternFlags();

    state.requests.forEach((request) => {
      const activity = reportActivityForRequest(request, range);
      if (!activity.submitted && !activity.approved && !activity.denied && !activity.pending) return;

      const key = programName(request);
      if (!groups.has(key)) {
        groups.set(key, {
          program: key,
          employees: new Set(),
          flaggedEmployees: new Set(),
          leadTimes: [],
          total: 0,
          approved: 0,
          denied: 0,
          in_review: 0
        });
      }

      const group = groups.get(key);
      const keyForEmployee = employeeKey(request);
      group.employees.add(keyForEmployee);
      if (flags.has(keyForEmployee)) group.flaggedEmployees.add(keyForEmployee);
      if (activity.submitted) group.total += 1;
      if (activity.approved) group.approved += 1;
      if (activity.denied) group.denied += 1;
      if (activity.pending) group.in_review += 1;
      const leadTime = requestLeadTimeDays(request);
      if (activity.submitted && leadTime !== null) group.leadTimes.push(leadTime);
    });

    return rows.concat(
      Array.from(groups.values())
        .sort((a, b) => a.program.localeCompare(b.program))
        .map((group) => [
          group.program,
          group.flaggedEmployees.size,
          group.employees.size,
          group.total,
          group.approved,
          group.denied,
          group.in_review,
          average(group.leadTimes)
        ])
    );
  }

  function detailReportRows(range) {
    return [
      [
        "Activity In Date Range",
        "Pattern Flag",
        "Pattern Details",
        "Submitted At",
        "Decision Date",
        "Employee Name",
        "Email",
        "Program",
        "Department",
        "Manager",
        "Time Off Type",
        "Requested Dates",
        "Business Days",
        "Status",
        "Request Lead Time (Days)",
        "Decision Note"
      ],
      ...sortBySubmitted(reportActivityRequests(range)).map((request) => {
        const activity = reportActivityForRequest(request, range);
        const flag = patternFlagForRequest(request);
        return [
          activity.labels.join("; "),
          flag ? "Yes" : "No",
          flag?.description || "",
          formatDateTime(request.created_at),
          activity.approved || activity.denied ? formatDateTime(request.updated_at) : "",
          employeeName(request),
          request.email,
          programName(request),
          request.department,
          request.manager,
          request.time_off_type,
          formatDateRange(request.start_date, request.end_date),
          request.business_days,
          statusLabels[request.status],
          requestLeadTimeDays(request),
          request.decision_note
        ];
      })
    ];
  }

  function downloadCsv(filename, rows) {
    const csv = rows.map((row) => row.map(csvValue).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function csvValue(value) {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function requestLeadTimeDays(request) {
    const submitted = parseDateTime(request.created_at);
    const start = parseLocalDate(request.start_date);
    if (!submitted || !start) return null;
    const submittedDay = new Date(submitted.getFullYear(), submitted.getMonth(), submitted.getDate());
    return Math.round((start - submittedDay) / 86400000);
  }

  function average(values) {
    if (!values.length) return "";
    const value = values.reduce((sum, item) => sum + item, 0) / values.length;
    return value.toFixed(1).replace(/\.0$/, "");
  }

  function ensureReportDateRange() {
    if (state.reportStartDate && state.reportEndDate) return;

    const range = defaultReportDateRange();
    state.reportStartDate = state.reportStartDate || range.start;
    state.reportEndDate = state.reportEndDate || range.end;
  }

  function defaultReportDateRange() {
    const dates = state.requests.flatMap((request) => {
      const requestDates = [activityDate(request.created_at)];
      if (request.status === "approved" || request.status === "denied") {
        requestDates.push(activityDate(request.updated_at));
      }
      return requestDates.filter(Boolean);
    });

    if (!dates.length) {
      const today = toDateInput(new Date());
      return { start: today, end: today };
    }

    dates.sort((a, b) => a - b);
    return {
      start: toDateInput(dates[0]),
      end: toDateInput(dates[dates.length - 1])
    };
  }

  function currentReportDateRange() {
    const start = parseLocalDate(state.reportStartDate);
    const end = parseLocalDate(state.reportEndDate);
    return {
      start,
      end,
      valid: Boolean(start && end && start <= end)
    };
  }

  function reportRangeSummary(range, count) {
    if (!range.valid) return "Invalid date range";
    return `${count} matching requests from ${formatDateRange(state.reportStartDate, state.reportEndDate)}`;
  }

  function reportActivityRequests(range) {
    return state.requests.filter((request) => {
      const activity = reportActivityForRequest(request, range);
      return activity.submitted || activity.approved || activity.denied || activity.pending;
    });
  }

  function reportActivityForRequest(request, range) {
    const submitted = dateInRange(activityDate(request.created_at), range);
    const approved = request.status === "approved" && dateInRange(activityDate(request.updated_at), range);
    const denied = request.status === "denied" && dateInRange(activityDate(request.updated_at), range);
    const pending = request.status === "in_review" && submitted;
    const labels = [];

    if (submitted) labels.push("Submitted");
    if (approved) labels.push("Approved");
    if (denied) labels.push("Denied");
    if (pending && !labels.includes("Submitted")) labels.push("Pending");

    return { submitted, approved, denied, pending, labels };
  }

  function dateInRange(date, range) {
    return Boolean(range.valid && date && date >= range.start && date <= range.end);
  }

  function activityDate(value) {
    const date = parseDateTime(value);
    if (!date) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function patternFlags() {
    const employees = new Map();

    state.requests.forEach((request) => {
      const key = employeeKey(request);
      if (!key) return;
      if (!employees.has(key)) {
        employees.set(key, {
          name: employeeName(request),
          weekdays: new Map()
        });
      }

      const employee = employees.get(key);
      requestWeekdayOccurrences(request).forEach((date, weekday) => {
        if (!employee.weekdays.has(weekday)) {
          employee.weekdays.set(weekday, []);
        }
        employee.weekdays.get(weekday).push({
          date,
          requestId: request.id
        });
      });
    });

    const flags = new Map();
    employees.forEach((employee, key) => {
      employee.weekdays.forEach((occurrences, weekday) => {
        const match = patternWindow(occurrences);
        if (!match || flags.has(key)) return;

        flags.set(key, {
          weekday,
          count: match.count,
          startDate: toDateInput(match.startDate),
          endDate: toDateInput(match.endDate),
          description: `${employee.name} has ${match.count} ${dayNames[weekday]} requests within 6 weeks (${formatDateRange(toDateInput(match.startDate), toDateInput(match.endDate))}).`
        });
      });
    });

    return flags;
  }

  function patternWindow(occurrences) {
    const sorted = [...occurrences].sort((a, b) => a.date - b.date);
    let left = 0;

    for (let right = 0; right < sorted.length; right += 1) {
      while (daysBetween(sorted[left].date, sorted[right].date) > patternWindowDays) {
        left += 1;
      }

      const windowItems = sorted.slice(left, right + 1);
      const requestIds = new Set(windowItems.map((item) => item.requestId));
      if (requestIds.size >= patternRequestThreshold) {
        return {
          count: requestIds.size,
          startDate: windowItems[0].date,
          endDate: windowItems[windowItems.length - 1].date
        };
      }
    }

    return null;
  }

  function requestWeekdayOccurrences(request) {
    const start = parseLocalDate(request.start_date);
    const end = parseLocalDate(request.end_date);
    const occurrences = new Map();
    if (!start || !end) return occurrences;

    for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const weekday = date.getDay();
      if (weekday === 0 || weekday === 6 || occurrences.has(weekday)) continue;
      occurrences.set(weekday, new Date(date));
    }

    return occurrences;
  }

  function patternFlagForRequest(request) {
    return patternFlags().get(employeeKey(request));
  }

  function patternFlagBadge(flag) {
    if (!flag) return "";
    return `<span class="pattern-flag" role="img" aria-label="${escapeHtml(flag.description)}" title="${escapeHtml(flag.description)}"></span>`;
  }

  function daysBetween(start, end) {
    return Math.round((end - start) / 86400000);
  }

  function newSinceLastSignOn(requests) {
    const previous = parseDateTime(state.admin?.previousSignInAt);
    if (!previous) return sortBySubmitted(requests);
    return sortBySubmitted(requests.filter((request) => parseDateTime(request.created_at) > previous));
  }

  function approvedRequests() {
    return state.requests.filter((request) => request.status === "approved");
  }

  function employeeRequests() {
    if (!state.employee) return [];

    const source = state.demoMode || state.admin ? state.requests : state.employeeLoadedRequests;
    const employeeId = clean(state.employee.id);
    const email = clean(state.employee.email).toLowerCase();
    return source.filter((request) => {
      const requestUserId = clean(request.employee_user_id);
      const requestEmail = clean(request.email).toLowerCase();
      return (employeeId && requestUserId && requestUserId === employeeId) || (email && requestEmail === email);
    });
  }

  function syncEmployeeProfileForm() {
    const profile = state.employee?.profile || {};
    setFormValue(els.employeeProfileForm, "firstName", profile.first_name);
    setFormValue(els.employeeProfileForm, "lastName", profile.last_name);
    setFormValue(els.employeeProfileForm, "pronouns", profile.pronouns);
    setFormValue(els.employeeProfileForm, "program", profile.program);
    setFormValue(els.employeeProfileForm, "manager", profile.manager);
  }

  function syncRequestProfileFields() {
    const profile = state.employee?.profile || {};
    setFormValue(els.requestForm, "firstName", profile.first_name);
    setFormValue(els.requestForm, "lastName", profile.last_name);
    setFormValue(els.requestForm, "email", state.employee?.email || profile.email);
    setFormValue(els.requestForm, "program", profile.program);
    setFormValue(els.requestForm, "manager", profile.manager);

    els.requestForm.querySelectorAll("[data-profile-bound]").forEach((field) => {
      field.disabled = true;
    });
  }

  function setFormValue(form, name, value) {
    const field = form.elements[name];
    if (field) field.value = value || "";
  }

  function employeeDisplayName() {
    const profile = state.employee?.profile || {};
    const name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
    return name || state.employee?.email || "there";
  }

  function accountName(account) {
    const name = `${account.first_name || ""} ${account.last_name || ""}`.trim();
    return name || account.email || "Unknown account";
  }

  function isSuperAdmin() {
    return Boolean(state.admin?.isSuperAdmin || isSuperAdminEmail(state.admin?.email));
  }

  function isSuperAdminEmail(email) {
    return clean(email).toLowerCase() === superAdminEmail;
  }

  function missingProfileDetails(profile) {
    return !profile.first_name || !profile.last_name || !profile.program || !profile.manager;
  }

  function isAllowedProgram(value) {
    return programValues.has(programLabel(value));
  }

  function programLabel(value) {
    const text = clean(value);
    const labels = {
      "bridge clinic": "Access",
      "wellness access": "Access",
      "hope outpatient": "Outpatient",
      "lighthouse recovery": "Recovery",
      "shoreline residential": "Shore Haven",
      "harbor house": "SOS"
    };
    return labels[text.toLowerCase()] || text;
  }

  function isBrightHarborEmail(email) {
    const normalized = clean(email).toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) && normalized.endsWith(brightHarborDomain);
  }

  function showBrightHarborEmailError() {
    const message = "You must use your Bright Harbor Email.";
    showPopup(message);
    setMessage(els.employeeAuthMessage, message, "error");
  }

  function showPopup(message) {
    els.popupAlertMessage.textContent = message;
    els.popupAlert.hidden = false;
    els.popupAlertClose.focus();
  }

  function hidePopup() {
    els.popupAlert.hidden = true;
    els.popupAlertMessage.textContent = "";
  }

  function employeeName(request) {
    const name = `${request.first_name || ""} ${request.last_name || ""}`.trim();
    return name || request.email || "Unknown employee";
  }

  function employeeKey(request) {
    return (request.email || `${request.first_name}-${request.last_name}`).toLowerCase();
  }

  function programName(request) {
    return programLabel(request.program) || request.department || "Unassigned";
  }

  function timeOffTypeLabel(value) {
    const text = clean(value);
    const key = text.toLowerCase();
    const labels = {
      "paid time off": "Vacation",
      pto: "Vacation",
      vacation: "Vacation",
      "sick time": "Sick",
      sick: "Sick",
      "personal day": "Personal",
      personal: "Personal",
      bereavement: "Personal",
      "unpaid time": "Unpaid",
      unpaid: "Unpaid"
    };
    return labels[key] || text;
  }

  function groupApprovedByEmployee(requests) {
    const groups = new Map();
    alphabetize(requests).forEach((request) => {
      const key = employeeKey(request);
      const name = employeeName(request);
      if (!groups.has(key)) {
        groups.set(key, { name, program: programName(request), department: request.department, flag: patternFlagForRequest(request), requests: [] });
      }
      groups.get(key).requests.push(request);
    });
    return Array.from(groups.values()).map((group) => ({
      ...group,
      requests: sortByDateRange(group.requests)
    }));
  }

  function workWeekCells(focus) {
    const start = new Date(focus);
    while (start.getDay() !== state.workWeek.startDay) {
      start.setDate(start.getDate() - 1);
    }
    return Array.from({ length: state.workWeek.length }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        date,
        iso: toDateInput(date),
        label: String(date.getDate()),
        muted: false
      };
    });
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

  function weekdayHeader() {
    return `
      <div class="weekday-row">
        ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<span class="weekday">${day}</span>`).join("")}
      </div>
    `;
  }

  function updateBusinessDayOutput() {
    const formData = new FormData(els.requestForm);
    const days = calculateBusinessDays(formData.get("startDate"), formData.get("endDate"), formData.get("partialDay"));
    els.daysOutput.textContent = `Request ${days} business ${days === 1 ? "day" : "days"}`;
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
    const required = ["first_name", "last_name", "email", "department", "program", "manager", "time_off_type", "start_date", "end_date", "partial_day"];
    if (required.some((key) => !payload[key])) return "Complete all required fields.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return "Enter a valid email address.";
    if (!isBrightHarborEmail(payload.email)) return "Use your Bright Harbor email address.";
    if (!isAllowedProgram(payload.program)) return "Choose a valid program.";
    if (!payload.business_days || payload.business_days <= 0) return "Choose dates that include at least one business day.";
    return "";
  }

  function filterRequests(requests, query) {
    const term = clean(query).toLowerCase();
    if (!term) return requests;
    return requests.filter((request) =>
      [request.first_name, request.last_name, request.email, request.department, request.program, request.manager, request.time_off_type, statusLabels[request.status]]
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

  function sortBySubmitted(requests) {
    return [...requests].sort((a, b) => {
      const date = new Date(a.created_at) - new Date(b.created_at);
      if (date) return date;
      return a.last_name.localeCompare(b.last_name);
    });
  }

  function sortByDateRange(requests) {
    return [...requests].sort((a, b) => {
      const start = a.start_date.localeCompare(b.start_date);
      if (start) return start;
      return a.end_date.localeCompare(b.end_date);
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
      if (Array.isArray(saved)) {
        const normalized = saved.map(normalizeRequest);
        const existingIds = new Set(normalized.map((request) => request.id));
        const missingSamples = sampleRequests.filter((request) => !existingIds.has(request.id));
        const hasOnlySampleRows = normalized.every((request) => request.id.startsWith("demo-"));
        if (missingSamples.length && hasOnlySampleRows) {
          const merged = normalized.concat(missingSamples.map(normalizeRequest));
          writeDemoRequests(merged);
          return merged;
        }
        return normalized;
      }
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
      if (!session || !session.token) return null;
      const email = clean(session.email).toLowerCase();
      const superAdmin = Boolean(session.isSuperAdmin) || isSuperAdminEmail(email);
      return {
        ...session,
        email,
        role: superAdmin ? "super_admin" : session.role || "admin",
        accountType: superAdmin ? "super_admin" : session.accountType || "admin",
        isSuperAdmin: superAdmin
      };
    } catch (error) {
      return null;
    }
  }

  function readEmployeeSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem(employeeSessionKey) || "null");
      if (!session || !session.token || !isBrightHarborEmail(session.email)) return null;
      return {
        ...session,
        email: clean(session.email).toLowerCase(),
        profile: normalizeProfile(session.profile, session)
      };
    } catch (error) {
      sessionStorage.removeItem(employeeSessionKey);
      return null;
    }
  }

  function writeEmployeeSession(employee) {
    sessionStorage.setItem(
      employeeSessionKey,
      JSON.stringify({
        id: employee.id || "",
        email: employee.email || "",
        token: employee.token || "",
        refreshToken: employee.refreshToken || "",
        profile: normalizeProfile(employee.profile, employee)
      })
    );
  }

  function registerDemoEmployee(email, profile) {
    const employee = {
      id: `demo-${email}`,
      email,
      token: "demo-employee-token",
      refreshToken: "",
      profile: normalizeProfile({ ...profile, email, id: `demo-${email}` })
    };
    writeDemoEmployeeProfile(employee.profile);
    return employee;
  }

  function loginDemoEmployee(email) {
    const profile = readDemoEmployeeProfile(email);
    if (!profile) {
      throw new Error("Create an account first.");
    }
    return {
      id: `demo-${email}`,
      email,
      token: "demo-employee-token",
      refreshToken: "",
      profile
    };
  }

  function saveDemoEmployeeProfile(profile) {
    const saved = normalizeProfile({
      ...profile,
      id: state.employee.id,
      email: state.employee.email
    });
    writeDemoEmployeeProfile(saved);
    return saved;
  }

  function readDemoEmployeeProfile(email) {
    const profiles = readDemoEmployeeProfiles();
    const profile = profiles[clean(email).toLowerCase()];
    return profile ? normalizeProfile(profile, { id: `demo-${email}`, email }) : null;
  }

  function writeDemoEmployeeProfile(profile) {
    const profiles = readDemoEmployeeProfiles();
    profiles[profile.email] = normalizeProfile(profile);
    localStorage.setItem(demoEmployeeProfilesKey, JSON.stringify(profiles));
  }

  function demoAdminAccounts() {
    const accounts = new Map();
    const now = new Date().toISOString();

    accounts.set(superAdminEmail, normalizeAccount({
      id: "demo-super-admin",
      email: superAdminEmail,
      first_name: "HR",
      last_name: "Admin",
      program: "",
      manager: "",
      account_type: "super_admin",
      is_super_admin: true,
      created_at: now,
      updated_at: now
    }));

    state.requests.forEach((request) => {
      const email = clean(request.email).toLowerCase();
      if (!email || accounts.has(email)) return;
      accounts.set(email, normalizeAccount({
        id: request.employee_user_id || `demo-${email}`,
        email,
        first_name: request.first_name,
        last_name: request.last_name,
        program: request.program,
        manager: request.manager,
        account_type: "employee",
        created_at: request.created_at,
        updated_at: request.updated_at
      }));
    });

    Object.values(readDemoEmployeeProfiles()).forEach((profile) => {
      const normalized = normalizeAccount({
        ...profile,
        account_type: accounts.get(profile.email)?.account_type || "employee"
      });
      if (normalized.email) accounts.set(normalized.email, normalized);
    });

    return sortAccounts(Array.from(accounts.values()));
  }

  function readDemoEmployeeProfiles() {
    try {
      const profiles = JSON.parse(localStorage.getItem(demoEmployeeProfilesKey) || "{}");
      return profiles && typeof profiles === "object" ? profiles : {};
    } catch (error) {
      localStorage.removeItem(demoEmployeeProfilesKey);
      return {};
    }
  }

  function readDemoLastSignIn(email) {
    try {
      const history = JSON.parse(localStorage.getItem(demoLoginKey) || "{}");
      return history[email] || null;
    } catch (error) {
      localStorage.removeItem(demoLoginKey);
      return null;
    }
  }

  function writeDemoLastSignIn(email, date) {
    let history = {};
    try {
      history = JSON.parse(localStorage.getItem(demoLoginKey) || "{}");
    } catch (error) {
      history = {};
    }
    history[email] = date;
    localStorage.setItem(demoLoginKey, JSON.stringify(history));
  }

  function readWorkWeek() {
    try {
      const saved = JSON.parse(localStorage.getItem(workWeekKey) || "null");
      if (saved && Number.isInteger(saved.startDay) && Number.isInteger(saved.length)) {
        return {
          startDay: Math.min(Math.max(saved.startDay, 0), 6),
          length: Math.min(Math.max(saved.length, 5), 7)
        };
      }
    } catch (error) {
      localStorage.removeItem(workWeekKey);
    }
    return { startDay: 1, length: 5 };
  }

  function writeWorkWeek(workWeek) {
    localStorage.setItem(workWeekKey, JSON.stringify(workWeek));
  }

  function upsertRequest(request, requests) {
    const next = requests.filter((item) => item.id !== request.id);
    next.push(request);
    return alphabetize(next);
  }

  function normalizeRequest(request) {
    return {
      id: String(request.id),
      employee_user_id: request.employee_user_id || request.employeeUserId || "",
      first_name: request.first_name || request.firstName || "",
      last_name: request.last_name || request.lastName || "",
      email: request.email || "",
      department: request.department || "",
      program: programLabel(request.program || request.programName || request.department) || "Unassigned",
      manager: request.manager || "",
      time_off_type: timeOffTypeLabel(request.time_off_type || request.timeOffType),
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

  function normalizeProfile(profile = {}, employee = {}) {
    return {
      id: String(profile.id || employee.id || ""),
      email: clean(profile.email || employee.email).toLowerCase(),
      first_name: clean(profile.first_name || profile.firstName),
      last_name: clean(profile.last_name || profile.lastName),
      pronouns: clean(profile.pronouns),
      program: programLabel(profile.program),
      manager: clean(profile.manager)
    };
  }

  function normalizeAccount(account = {}) {
    const email = clean(account.email).toLowerCase();
    const superAdmin = Boolean(account.is_super_admin || account.isSuperAdmin) || isSuperAdminEmail(email);
    return {
      id: String(account.id || ""),
      email,
      first_name: clean(account.first_name || account.firstName),
      last_name: clean(account.last_name || account.lastName),
      pronouns: clean(account.pronouns),
      program: programLabel(account.program),
      manager: clean(account.manager),
      account_type: superAdmin ? "super_admin" : account.account_type === "admin" || account.accountType === "admin" ? "admin" : "employee",
      is_super_admin: superAdmin,
      created_at: account.created_at || account.createdAt || "",
      updated_at: account.updated_at || account.updatedAt || ""
    };
  }

  function sortAccounts(accounts) {
    return [...accounts].sort((a, b) => {
      const last = a.last_name.localeCompare(b.last_name);
      if (last) return last;
      const first = a.first_name.localeCompare(b.first_name);
      if (first) return first;
      return a.email.localeCompare(b.email);
    });
  }

  function upsertAccount(account, accounts) {
    const next = accounts.filter((item) => item.id !== account.id);
    next.push(account);
    return sortAccounts(next);
  }

  function setHubCount(area, text) {
    const element = els.adminHomePage.querySelector(`[data-hub-count="${area}"]`);
    if (element) element.textContent = text;
  }

  function adminDisplayName() {
    return state.admin?.name || deriveAdminName(state.admin?.email || "Admin");
  }

  function deriveAdminName(email) {
    const prefix = String(email || "Admin").split("@")[0] || "Admin";
    return prefix
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
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

  function parseDateTime(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function parseMonthInput(value) {
    if (!value) return null;
    const parts = String(value).split("-").map(Number);
    if (parts.length !== 2 || parts.some(Number.isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, 1);
  }

  function toDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function toMonthInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  function formatDateRange(start, end) {
    const startDate = parseLocalDate(start);
    const endDate = parseLocalDate(end);
    if (!startDate || !endDate) return "";
    const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
    return start === end ? formatter.format(startDate) : `${formatter.format(startDate)} to ${formatter.format(endDate)}`;
  }

  function formatDateTime(value) {
    const date = parseDateTime(value);
    if (!date) return "";
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function setMessage(element, text, type) {
    element.textContent = text;
    element.className = `form-message ${type || ""}`.trim();
  }

  function toggleForm(form, disabled) {
    form.querySelectorAll("button, input, select, textarea").forEach((element) => {
      element.disabled = disabled || element.hasAttribute("data-profile-bound");
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
