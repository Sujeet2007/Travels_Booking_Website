const CITIES = [
  "New York", "London", "Paris", "Tokyo", "Dubai", "Bali", "Santorini",
  "Rome", "Barcelona", "Sydney", "Singapore", "Los Angeles", "Chicago",
];

const DESTINATIONS = [
  { id: "paris", name: "Paris", country: "France", price: 899, image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop" },
  { id: "tokyo", name: "Tokyo", country: "Japan", price: 1249, image: "https://images.unsplash.com/photo-1540959733332-eab4de63cd21?w=600&h=400&fit=crop" },
  { id: "bali", name: "Bali", country: "Indonesia", price: 749, image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop" },
  { id: "santorini", name: "Santorini", country: "Greece", price: 1099, image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49b?w=600&h=400&fit=crop" },
  { id: "newyork", name: "New York", country: "USA", price: 649, image: "https://images.unsplash.com/photo-1496442226666-8d0d0e62e6e9?w=600&h=400&fit=crop" },
  { id: "dubai", name: "Dubai", country: "UAE", price: 999, image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop" },
];

const DEALS = [
  { title: "European Summer Sale", description: "Round-trip flights to Paris, Rome, or Barcelona", discount: 25, price: 449, original: 599, type: "flight", from: "New York", to: "Paris" },
  { title: "Tropical Getaway", description: "7-night all-inclusive resort in Bali", discount: 30, price: 899, original: 1299, type: "hotel", destination: "Bali" },
  { title: "City Break Bundle", description: "Flight + 3 nights hotel in Tokyo", discount: 20, price: 1199, original: 1499, type: "package", packageId: "tokyo" },
];

const PACKAGES = {
  bali: { name: "Bali Paradise", nights: 7, price: 1899, includes: "Flights, hotel, breakfast, airport transfer" },
  paris: { name: "Paris Romance", nights: 5, price: 1599, includes: "Flights, boutique hotel, Seine cruise" },
  tokyo: { name: "Tokyo Explorer", nights: 6, price: 2199, includes: "Flights, hotel, rail pass, city tour" },
  santorini: { name: "Santorini Escape", nights: 4, price: 1799, includes: "Flights, cliffside hotel, wine tasting" },
};

const STORAGE_KEY = "wanderlust_bookings";

let currentTab = "flights";
let selectedResult = null;
let lastFormData = null;
let sortOrder = "price-asc";

function init() {
  populateCityList();
  setMinDates();
  renderDestinations();
  renderDeals();
  setupEventListeners();
  updateTripTypeUI();
  updateBookingBadge();
}

function populateCityList() {
  const list = document.getElementById("cityList");
  if (list) {
    list.innerHTML = CITIES.map((c) => `<option value="${c}">`).join("");
  }
}

function setMinDates() {
  const today = new Date().toISOString().split("T")[0];
  ["depart", "return", "checkin", "checkout", "packageDate"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.min = today;
  });
}

function setupEventListeners() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  document.getElementById("searchBtn").addEventListener("click", handleSearch);
  document.getElementById("bookingForm").addEventListener("submit", (e) => {
    e.preventDefault();
    handleSearch();
  });

  document.getElementById("swapBtn").addEventListener("click", swapCities);
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("bookingsModalClose").addEventListener("click", closeBookingsModal);
  document.getElementById("viewBookingsBtn").addEventListener("click", showBookings);
  document.getElementById("navToggle").addEventListener("click", toggleNav);

  document.querySelectorAll('input[name="tripType"]').forEach((radio) => {
    radio.addEventListener("change", updateTripTypeUI);
  });

  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", () => {
      closeModal();
      closeBookingsModal();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeBookingsModal();
    }
  });
}

function updateTripTypeUI() {
  const isOneWay = document.querySelector('input[name="tripType"]:checked')?.value === "oneway";
  const returnGroup = document.getElementById("returnGroup");
  const returnInput = document.getElementById("return");
  if (returnGroup) returnGroup.classList.toggle("hidden", isOneWay);
  if (returnInput && isOneWay) returnInput.value = "";
}

function switchTab(tab) {
  currentTab = tab;
  clearFormError();
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  document.querySelectorAll(".form-panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === tab));
}

function swapCities() {
  const from = document.getElementById("from");
  const to = document.getElementById("to");
  [from.value, to.value] = [to.value, from.value];
}

function toggleNav() {
  document.querySelector(".nav").classList.toggle("open");
}

function showFormError(message) {
  const el = document.getElementById("formError");
  el.textContent = message;
  el.hidden = false;
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearFormError() {
  const el = document.getElementById("formError");
  if (el) {
    el.textContent = "";
    el.hidden = true;
  }
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function setSearchLoading(loading) {
  const btn = document.getElementById("searchBtn");
  const label = btn.querySelector(".btn-label");
  const loadingEl = btn.querySelector(".btn-loading");
  btn.disabled = loading;
  label.hidden = loading;
  loadingEl.hidden = !loading;
}

async function handleSearch() {
  clearFormError();
  const formData = getFormData();
  const errors = validateForm(formData);

  if (errors.length > 0) {
    showFormError(errors[0]);
    showToast(errors[0], "error");
    return;
  }

  setSearchLoading(true);

  await new Promise((r) => setTimeout(r, 800));

  const results = generateResults(currentTab, formData);
  lastFormData = formData;
  selectedResult = results[0];
  setSearchLoading(false);
  showResultsModal(results, formData);
  showToast(`Found ${results.length} options for your ${formData.type.toLowerCase()}`, "success");
}

function getFormData() {
  if (currentTab === "flights") {
    const tripType = document.querySelector('input[name="tripType"]:checked')?.value || "roundtrip";
    return {
      type: "Flight",
      from: document.getElementById("from").value.trim(),
      to: document.getElementById("to").value.trim(),
      depart: document.getElementById("depart").value,
      return: tripType === "oneway" ? "" : document.getElementById("return").value,
      tripType,
      travelers: parseInt(document.getElementById("travelers").value, 10),
    };
  }
  if (currentTab === "hotels") {
    return {
      type: "Hotel",
      destination: document.getElementById("destination").value.trim(),
      checkin: document.getElementById("checkin").value,
      checkout: document.getElementById("checkout").value,
      travelers: parseInt(document.getElementById("guests").value, 10),
    };
  }
  const pkgId = document.getElementById("packageDest").value;
  const pkg = PACKAGES[pkgId];
  return {
    type: "Package",
    packageId: pkgId,
    packageName: pkg?.name || "",
    packageIncludes: pkg?.includes || "",
    packageDate: document.getElementById("packageDate").value,
    travelers: parseInt(document.getElementById("packageTravelers").value, 10),
    nights: pkg?.nights,
    basePrice: pkg?.price,
  };
}

function validateForm(data) {
  const errors = [];

  if (currentTab === "flights") {
    if (!data.from) errors.push("Please enter a departure city.");
    else if (!data.to) errors.push("Please enter a destination city.");
    else if (data.from.toLowerCase() === data.to.toLowerCase()) errors.push("Departure and destination must be different.");
    else if (!data.depart) errors.push("Please select a departure date.");
    else if (data.tripType === "roundtrip" && data.return && data.return < data.depart) errors.push("Return date must be after departure.");
  } else if (currentTab === "hotels") {
    if (!data.destination) errors.push("Please enter a destination.");
    else if (!data.checkin) errors.push("Please select a check-in date.");
    else if (!data.checkout) errors.push("Please select a check-out date.");
    else if (data.checkout <= data.checkin) errors.push("Check-out must be after check-in.");
  } else {
    if (!data.packageId) errors.push("Please select a vacation package.");
    else if (!data.packageDate) errors.push("Please select a start date.");
  }

  return errors;
}

function generateResults(tab, formData) {
  const travelers = formData.travelers || 1;

  if (tab === "flights") {
    const airlines = [
      { name: "Economy", airline: "SkyWings", duration: "6h 20m", stops: "Non-stop" },
      { name: "Premium Economy", airline: "Global Air", duration: "5h 45m", stops: "Non-stop" },
      { name: "Business", airline: "LuxFly", duration: "5h 30m", stops: "Non-stop" },
    ];
    const basePrices = [189, 279, 449];
    return airlines.map((a, i) => ({
      id: `flight-${i}`,
      name: a.name,
      airline: a.airline,
      duration: a.duration,
      stops: a.stops,
      price: basePrices[i] * travelers,
      details: `${formData.from} → ${formData.to} · ${formatDate(formData.depart)}${formData.return ? ` – ${formatDate(formData.return)}` : ""} · ${travelers} traveler${travelers > 1 ? "s" : ""}`,
      rating: (4.2 + i * 0.3).toFixed(1),
    }));
  }

  if (tab === "hotels") {
    const rooms = [
      { name: "Standard Room", stars: 3, amenities: "WiFi, Breakfast" },
      { name: "Deluxe Room", stars: 4, amenities: "WiFi, Breakfast, Pool" },
      { name: "Suite", stars: 5, amenities: "WiFi, Breakfast, Spa, View" },
    ];
    const nights = daysBetween(formData.checkin, formData.checkout) || 1;
    const basePrices = [89, 139, 219];
    return rooms.map((r, i) => ({
      id: `hotel-${i}`,
      name: r.name,
      stars: r.stars,
      amenities: r.amenities,
      price: basePrices[i] * nights * travelers,
      details: `${formData.destination} · ${formatDate(formData.checkin)} – ${formatDate(formData.checkout)} · ${nights} night${nights > 1 ? "s" : ""}`,
      rating: (4.0 + i * 0.4).toFixed(1),
    }));
  }

  const tiers = [
    { name: "Essential", multiplier: 1 },
    { name: "Comfort", multiplier: 1.25 },
    { name: "Luxury", multiplier: 1.55 },
  ];
  const base = formData.basePrice || 1500;
  return tiers.map((t, i) => ({
    id: `pkg-${i}`,
    name: t.name,
    price: Math.round(base * t.multiplier * travelers),
    details: `${formData.packageName} · ${formData.nights} nights · starts ${formatDate(formData.packageDate)} · ${travelers} traveler${travelers > 1 ? "s" : ""}`,
    includes: formData.packageIncludes,
    rating: (4.5 + i * 0.2).toFixed(1),
  }));
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysBetween(start, end) {
  if (!start || !end) return 0;
  const ms = new Date(end) - new Date(start);
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function sortResults(results, order) {
  const sorted = [...results];
  if (order === "price-asc") sorted.sort((a, b) => a.price - b.price);
  else if (order === "price-desc") sorted.sort((a, b) => b.price - a.price);
  else if (order === "rating") sorted.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  return sorted;
}

function showResultsModal(results, formData) {
  const modal = document.getElementById("bookingModal");
  const body = document.getElementById("modalBody");
  sortOrder = "price-asc";
  const sorted = sortResults(results, sortOrder);

  body.innerHTML = `
    <h2>Available ${formData.type}s</h2>
    <p class="modal-subtitle">${sorted.length} options found — select one to continue</p>
    <div class="results-toolbar">
      <label>Sort by
        <select id="sortSelect">
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>
      </label>
    </div>
    <div class="results-list" id="resultsList">
      ${renderResultItems(sorted)}
    </div>
    <button class="btn btn-primary" id="confirmBookingBtn" style="width: 100%;">
      Continue — $${sorted[0].price}
    </button>
  `;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
  selectedResult = sorted[0];

  document.getElementById("sortSelect").addEventListener("change", (e) => {
    sortOrder = e.target.value;
    const reSorted = sortResults(generateResults(currentTab, formData), sortOrder);
    document.getElementById("resultsList").innerHTML = renderResultItems(reSorted);
    bindResultClicks(reSorted, formData);
    selectedResult = reSorted.find((r) => r.id === selectedResult?.id) || reSorted[0];
    updateConfirmBtn();
  });

  bindResultClicks(sorted, formData);
  document.getElementById("confirmBookingBtn").addEventListener("click", () => showPassengerStep(formData));
}

function renderResultItems(results) {
  return results
    .map(
      (r, i) => `
    <div class="result-item ${i === 0 && selectedResult?.id === r.id ? "selected" : ""}" data-id="${r.id}">
      <div class="result-info">
        <h4>${r.name}${r.airline ? ` · ${r.airline}` : ""}</h4>
        <p>${r.details}</p>
        ${r.duration ? `<p class="result-meta">${r.duration} · ${r.stops}</p>` : ""}
        ${r.amenities ? `<p class="result-meta">${"★".repeat(r.stars)} · ${r.amenities}</p>` : ""}
        ${r.includes ? `<p class="result-meta">${r.includes}</p>` : ""}
        <span class="result-rating">★ ${r.rating}</span>
      </div>
      <span class="result-price">$${r.price}</span>
    </div>
  `
    )
    .join("");
}

function bindResultClicks(results, formData) {
  const body = document.getElementById("modalBody");
  body.querySelectorAll(".result-item").forEach((item) => {
    item.addEventListener("click", () => {
      body.querySelectorAll(".result-item").forEach((el) => el.classList.remove("selected"));
      item.classList.add("selected");
      selectedResult = results.find((r) => r.id === item.dataset.id);
      updateConfirmBtn();
    });
  });
}

function updateConfirmBtn() {
  const btn = document.getElementById("confirmBookingBtn");
  if (btn && selectedResult) btn.textContent = `Continue — $${selectedResult.price}`;
}

function showPassengerStep(formData) {
  if (!selectedResult) return;
  const body = document.getElementById("modalBody");
  const travelers = formData.travelers || 1;

  let passengerFields = "";
  for (let i = 1; i <= travelers; i++) {
    passengerFields += `
      <div class="passenger-block">
        <h4>Traveler ${i}</h4>
        <div class="form-row">
          <div class="form-group">
            <label>First name</label>
            <input type="text" class="p-first" placeholder="First name" required>
          </div>
          <div class="form-group">
            <label>Last name</label>
            <input type="text" class="p-last" placeholder="Last name" required>
          </div>
        </div>
      </div>
    `;
  }

  body.innerHTML = `
    <h2>Traveler details</h2>
    <p class="modal-subtitle">${selectedResult.name} — $${selectedResult.price}</p>
    <div class="selected-summary">
      <p>${selectedResult.details}</p>
    </div>
    <form id="passengerForm" class="passenger-form">
      ${passengerFields}
      <div class="form-group full">
        <label for="contactEmail">Email for confirmation</label>
        <input type="email" id="contactEmail" placeholder="you@example.com" required>
      </div>
      <div class="form-group full">
        <label for="contactPhone">Phone (optional)</label>
        <input type="tel" id="contactPhone" placeholder="+1 555 000 0000">
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-outline" id="backToResults">Back</button>
        <button type="submit" class="btn btn-primary">Confirm & Pay $${selectedResult.price}</button>
      </div>
    </form>
  `;

  document.getElementById("backToResults").addEventListener("click", () => {
    const results = generateResults(currentTab, formData);
    showResultsModal(results, formData);
    selectedResult = results.find((r) => r.id === selectedResult?.id) || results[0];
    document.querySelectorAll(".result-item").forEach((el) => {
      el.classList.toggle("selected", el.dataset.id === selectedResult.id);
    });
  });

  document.getElementById("passengerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("contactEmail").value.trim();
    if (!email || !email.includes("@")) {
      showToast("Please enter a valid email address.", "error");
      return;
    }
    const firstInputs = document.querySelectorAll(".p-first");
    for (const input of firstInputs) {
      if (!input.value.trim()) {
        showToast("Please fill in all traveler names.", "error");
        return;
      }
    }
    confirmBooking(formData, email);
  });
}

function confirmBooking(formData, email) {
  const booking = {
    id: "WL-" + Date.now().toString(36).toUpperCase(),
    type: formData.type,
    details: selectedResult.details,
    option: selectedResult.name,
    price: selectedResult.price,
    email,
    date: new Date().toISOString(),
    status: "Confirmed",
  };

  saveBooking(booking);
  updateBookingBadge();
  showConfirmation(booking);
  showToast("Booking confirmed! Check My Bookings.", "success");
}

function showConfirmation(booking) {
  const body = document.getElementById("modalBody");
  body.innerHTML = `
    <div class="modal-success">
      <div class="success-icon">✓</div>
      <h3>Booking confirmed!</h3>
      <p>Confirmation sent to <strong>${booking.email}</strong></p>
      <dl class="booking-details">
        <dt>Confirmation ID</dt>
        <dd class="confirmation-id">${booking.id}</dd>
        <dt>Type</dt>
        <dd>${booking.type} — ${booking.option}</dd>
        <dt>Details</dt>
        <dd>${booking.details}</dd>
        <dt>Total paid</dt>
        <dd>$${booking.price}</dd>
      </dl>
      <div class="modal-actions">
        <button class="btn btn-outline" id="viewBookingsFromConfirm">View all bookings</button>
        <button class="btn btn-primary" id="doneBtn">Done</button>
      </div>
    </div>
  `;
  document.getElementById("doneBtn").addEventListener("click", closeModal);
  document.getElementById("viewBookingsFromConfirm").addEventListener("click", () => {
    closeModal();
    showBookings();
  });
}

function saveBooking(booking) {
  const bookings = getBookings();
  bookings.unshift(booking);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function getBookings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function cancelBooking(id) {
  const bookings = getBookings().map((b) =>
    b.id === id ? { ...b, status: "Cancelled" } : b
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  updateBookingBadge();
  showBookings();
  showToast("Booking cancelled.", "info");
}

function deleteBooking(id) {
  const bookings = getBookings().filter((b) => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  updateBookingBadge();
  showBookings();
  showToast("Booking removed.", "info");
}

function updateBookingBadge() {
  const active = getBookings().filter((b) => b.status === "Confirmed").length;
  const btn = document.getElementById("viewBookingsBtn");
  if (active > 0) {
    btn.textContent = `My Bookings (${active})`;
  } else {
    btn.textContent = "My Bookings";
  }
}

function showBookings() {
  const modal = document.getElementById("bookingsModal");
  const list = document.getElementById("bookingsList");
  const bookings = getBookings();

  if (bookings.length === 0) {
    list.innerHTML = `<div class="empty-bookings"><p>No bookings yet.</p><p>Search and book your first trip!</p></div>`;
  } else {
    list.innerHTML = bookings
      .map(
        (b) => `
      <div class="booking-item ${b.status === "Cancelled" ? "cancelled" : ""}">
        <div class="booking-item-info">
          <h4>${b.type} — ${b.option}</h4>
          <p>${b.details}</p>
          <p><strong>$${b.price}</strong> · ${b.id}</p>
          ${b.email ? `<p class="booking-email">${b.email}</p>` : ""}
        </div>
        <div class="booking-item-actions">
          <span class="status status-${b.status.toLowerCase()}">${b.status}</span>
          ${b.status === "Confirmed" ? `<button class="btn btn-sm btn-outline cancel-btn" data-id="${b.id}">Cancel</button>` : ""}
          <button class="btn btn-sm btn-outline delete-btn" data-id="${b.id}">Remove</button>
        </div>
      </div>
    `
      )
      .join("");

    list.querySelectorAll(".cancel-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (confirm("Cancel this booking?")) cancelBooking(btn.dataset.id);
      });
    });

    list.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (confirm("Remove this booking from your list?")) deleteBooking(btn.dataset.id);
      });
    });
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById("bookingModal").classList.remove("active");
  document.body.style.overflow = "";
  selectedResult = null;
}

function closeBookingsModal() {
  document.getElementById("bookingsModal").classList.remove("active");
  document.body.style.overflow = "";
}

function renderDestinations() {
  const grid = document.getElementById("destinationsGrid");
  grid.innerHTML = DESTINATIONS.map(
    (d) => `
    <article class="destination-card" data-dest="${d.name}">
      <div class="destination-image" style="background-image: url('${d.image}')"></div>
      <div class="destination-info">
        <h3>${d.name}</h3>
        <p class="location">${d.country}</p>
        <div class="destination-footer">
          <span class="destination-price">$${d.price} <span>/ person</span></span>
          <button type="button" class="btn btn-accent btn-sm" data-book="${d.name}">Book</button>
        </div>
      </div>
    </article>
  `
  ).join("");

  grid.querySelectorAll("[data-book]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      prefillFlight("New York", btn.dataset.book);
    });
  });

  grid.querySelectorAll(".destination-card").forEach((card) => {
    card.addEventListener("click", () => prefillFlight("New York", card.dataset.dest));
  });
}

function prefillFlight(from, to) {
  document.getElementById("from").value = from;
  document.getElementById("to").value = to;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  document.getElementById("depart").value = tomorrow.toISOString().split("T")[0];
  const ret = new Date(tomorrow);
  ret.setDate(ret.getDate() + 7);
  document.getElementById("return").value = ret.toISOString().split("T")[0];
  switchTab("flights");
  clearFormError();
  document.querySelector(".hero").scrollIntoView({ behavior: "smooth" });
  showToast(`Prefilled trip to ${to}. Click Search & Book!`, "info");
}

function renderDeals() {
  const grid = document.getElementById("dealsGrid");
  grid.innerHTML = DEALS.map(
    (d) => `
    <article class="deal-card" data-type="${d.type}">
      <div class="deal-badge">
        <span class="percent">${d.discount}%</span>
        <span>OFF</span>
      </div>
      <div class="deal-content">
        <h3>${d.title}</h3>
        <p>${d.description}</p>
        <p class="deal-price">
          <span class="original">$${d.original}</span>
          $${d.price}
        </p>
        <button type="button" class="btn btn-primary btn-sm deal-book">Book deal</button>
      </div>
    </article>
  `
  ).join("");

  grid.querySelectorAll(".deal-book").forEach((btn, i) => {
    btn.addEventListener("click", () => {
      const deal = DEALS[i];
      if (deal.type === "flight") {
        prefillFlight(deal.from, deal.to);
      } else if (deal.type === "hotel") {
        switchTab("hotels");
        document.getElementById("destination").value = deal.destination;
        setDefaultHotelDates();
        document.querySelector(".hero").scrollIntoView({ behavior: "smooth" });
        showToast("Deal applied! Click Search & Book.", "info");
      } else {
        switchTab("packages");
        document.getElementById("packageDest").value = deal.packageId;
        const d = new Date();
        d.setDate(d.getDate() + 14);
        document.getElementById("packageDate").value = d.toISOString().split("T")[0];
        document.querySelector(".hero").scrollIntoView({ behavior: "smooth" });
        showToast("Package selected! Click Search & Book.", "info");
      }
    });
  });
}

function setDefaultHotelDates() {
  const checkin = new Date();
  checkin.setDate(checkin.getDate() + 14);
  const checkout = new Date(checkin);
  checkout.setDate(checkout.getDate() + 5);
  document.getElementById("checkin").value = checkin.toISOString().split("T")[0];
  document.getElementById("checkout").value = checkout.toISOString().split("T")[0];
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
