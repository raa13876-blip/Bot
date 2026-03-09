const GAMES = ["Genshin Impact", "Valorant", "Fortnite", "CS2", "Honkai Star Rail"];

const storage = {
  get(key, fallback = []) {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];
const page = document.body.dataset.page;

function seedData() {
  if (storage.get("users").length) return;
  const seller = {
    id: id(),
    name: "ProSeller",
    email: "seller@gamemarket.ru",
    password: "123456",
    ratings: [5, 4, 5],
    createdAt: now()
  };
  const buyer = {
    id: id(),
    name: "DemoBuyer",
    email: "buyer@gamemarket.ru",
    password: "123456",
    ratings: [],
    createdAt: now()
  };
  storage.set("users", [seller, buyer]);
  storage.set("listings", [
    {
      id: id(),
      sellerId: seller.id,
      game: "Genshin Impact",
      level: "AR 58",
      characters: "Raiden, Nahida, Furina",
      canChangeEmail: true,
      description: "Легендарный аккаунт с редкими персонажами и оружием R5.",
      price: 15990,
      status: "active",
      createdAt: now()
    },
    {
      id: id(),
      sellerId: seller.id,
      game: "Valorant",
      level: "145",
      characters: "Prime, Reaver, Oni",
      canChangeEmail: false,
      description: "Высокий ранг, много скинов, быстрая передача.",
      price: 8990,
      status: "active",
      createdAt: now()
    }
  ]);
  storage.set("purchases", []);
  storage.set("notifications", []);
  storage.set("reviews", []);
}

function getCurrentUser() {
  const currentId = localStorage.getItem("currentUserId");
  if (!currentId) return null;
  return storage.get("users").find((u) => u.id === currentId) || null;
}

function saveUsers(users) { storage.set("users", users); }
function getUsers() { return storage.get("users"); }
function getListings() { return storage.get("listings"); }
function saveListings(listings) { storage.set("listings", listings); }
function getPurchases() { return storage.get("purchases"); }
function savePurchases(purchases) { storage.set("purchases", purchases); }
function getNotifications() { return storage.get("notifications"); }
function saveNotifications(n) { storage.set("notifications", n); }
function getReviews() { return storage.get("reviews"); }
function saveReviews(r) { storage.set("reviews", r); }

function ratingOf(user) {
  if (!user?.ratings?.length) return "Нет оценок";
  const avg = user.ratings.reduce((a, b) => a + b, 0) / user.ratings.length;
  return `${avg.toFixed(1)} ★`;
}

function formatPrice(value) {
  return `${Number(value).toLocaleString("ru-RU")} ₽`;
}

function renderNav() {
  const nav = qs("#navActions");
  if (!nav) return;
  const user = getCurrentUser();
  nav.innerHTML = user
    ? `
      <a class="btn btn-ghost" href="profile.html">${user.name}</a>
      <button class="btn btn-danger" id="logoutBtn">Выйти</button>
    `
    : `
      <a class="btn btn-primary" href="login.html">Вход / Регистрация</a>
    `;

  const logoutBtn = qs("#logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem("currentUserId");
      location.href = "index.html";
    };
  }
}

function gameOptions(select, includeAll = false) {
  if (!select) return;
  select.innerHTML = `${includeAll ? '<option value="all">Все игры</option>' : ""}${GAMES.map((g) => `<option value="${g}">${g}</option>`).join("")}`;
}

function listingCard(listing, showManage = false) {
  const seller = getUsers().find((u) => u.id === listing.sellerId);
  return `
    <article class="card listing-card">
      <div><strong>${listing.game}</strong> <span class="status ${listing.status === "active" ? "status-active" : "status-sold"}">${listing.status === "active" ? "Продаётся" : "Продан"}</span></div>
      <div class="price">${formatPrice(listing.price)}</div>
      <div class="meta">Уровень: ${listing.level}</div>
      <div class="meta">${listing.description.slice(0, 84)}...</div>
      <div class="meta">Рейтинг продавца: ${ratingOf(seller)}</div>
      <div class="tag-list">
        <a class="btn btn-primary" href="account.html?id=${listing.id}">Подробнее</a>
        ${showManage ? `<a class="btn btn-ghost" href="add-account.html?edit=${listing.id}">Редактировать</a>
        <button class="btn btn-danger" data-delete="${listing.id}">Удалить</button>` : ""}
      </div>
    </article>
  `;
}

function initHome() {
  const searchInput = qs("#searchInput");
  const gameFilter = qs("#gameFilter");
  const statusFilter = qs("#statusFilter");
  const sortFilter = qs("#sortFilter");
  const listingsContainer = qs("#listingsContainer");
  const popularGames = qs("#popularGames");

  gameOptions(gameFilter, true);
  popularGames.innerHTML = GAMES.map((g) => `<button class="tag" data-game="${g}">${g}</button>`).join("");

  function render() {
    let listings = [...getListings()];
    const query = searchInput.value.trim().toLowerCase();
    if (query) listings = listings.filter((l) => `${l.game} ${l.description}`.toLowerCase().includes(query));
    if (gameFilter.value !== "all") listings = listings.filter((l) => l.game === gameFilter.value);
    if (statusFilter.value !== "all") listings = listings.filter((l) => l.status === statusFilter.value);
    if (sortFilter.value === "priceAsc") listings.sort((a, b) => a.price - b.price);
    if (sortFilter.value === "priceDesc") listings.sort((a, b) => b.price - a.price);
    if (sortFilter.value === "new") listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    listingsContainer.innerHTML = listings.length
      ? listings.map((l) => listingCard(l)).join("")
      : `<p class="empty">По вашему запросу ничего не найдено.</p>`;
  }

  [searchInput, gameFilter, statusFilter, sortFilter].forEach((el) => el.addEventListener("input", render));
  qsa(".tag").forEach((tag) => tag.addEventListener("click", () => {
    gameFilter.value = tag.dataset.game;
    render();
  }));
  render();
}

function initLogin() {
  const loginForm = qs("#loginForm");
  const registerForm = qs("#registerForm");

  loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(loginForm);
    const user = getUsers().find((u) => u.email === data.get("email") && u.password === data.get("password"));
    if (!user) return alert("Неверный email или пароль");
    localStorage.setItem("currentUserId", user.id);
    location.href = "index.html";
  });

  registerForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(registerForm);
    const users = getUsers();
    const email = String(data.get("email")).trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === email)) return alert("Пользователь с таким email уже существует");
    const user = {
      id: id(),
      name: String(data.get("name")).trim(),
      email,
      password: String(data.get("password")),
      ratings: [],
      createdAt: now()
    };
    users.push(user);
    saveUsers(users);
    localStorage.setItem("currentUserId", user.id);
    location.href = "profile.html";
  });
}

function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    alert("Необходимо войти в аккаунт");
    location.href = "login.html";
    return null;
  }
  return user;
}

function initAddListing() {
  const user = requireAuth();
  if (!user) return;
  const form = qs("#listingForm");
  const title = qs("#formTitle");
  gameOptions(qs("#gameSelect"));

  const params = new URLSearchParams(location.search);
  const editId = params.get("edit");
  const listings = getListings();
  const editable = listings.find((l) => l.id === editId && l.sellerId === user.id);

  if (editable) {
    title.textContent = "Редактирование объявления";
    form.game.value = editable.game;
    form.level.value = editable.level;
    form.characters.value = editable.characters;
    form.canChangeEmail.value = String(editable.canChangeEmail);
    form.description.value = editable.description;
    form.price.value = editable.price;
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const payload = {
      game: String(data.get("game")),
      level: String(data.get("level")).trim(),
      characters: String(data.get("characters")).trim(),
      canChangeEmail: data.get("canChangeEmail") === "true",
      description: String(data.get("description")).trim(),
      price: Number(data.get("price"))
    };

    if (editable) {
      Object.assign(editable, payload);
      saveListings(listings);
    } else {
      listings.push({
        id: id(),
        sellerId: user.id,
        status: "active",
        createdAt: now(),
        ...payload
      });
      saveListings(listings);
    }
    location.href = "profile.html";
  });
}

function initProfile() {
  const user = requireAuth();
  if (!user) return;
  const users = getUsers();
  const listings = getListings();
  const purchases = getPurchases();
  const reviews = getReviews();

  qs("#profileInfo").innerHTML = `
    <p><strong>${user.name}</strong></p>
    <p class="meta">Email: ${user.email}</p>
    <p class="meta">Рейтинг: ${ratingOf(user)}</p>
    <p class="meta">Дата регистрации: ${new Date(user.createdAt).toLocaleDateString("ru-RU")}</p>
  `;

  const myListings = listings.filter((l) => l.sellerId === user.id);
  qs("#myListings").innerHTML = myListings.length
    ? myListings.map((l) => listingCard(l, true)).join("")
    : `<p class="empty">У вас пока нет объявлений.</p>`;

  qsa("[data-delete]").forEach((btn) => btn.addEventListener("click", () => {
    const filtered = getListings().filter((l) => l.id !== btn.dataset.delete);
    saveListings(filtered);
    initProfile();
  }));

  const sales = purchases.filter((p) => p.sellerId === user.id);
  qs("#salesList").innerHTML = sales.length
    ? sales.map((sale) => {
        const listing = listings.find((l) => l.id === sale.listingId);
        return `<li>${listing?.game || "Аккаунт"} — ${formatPrice(sale.price)} (${new Date(sale.createdAt).toLocaleString("ru-RU")})</li>`;
      }).join("")
    : `<li>Продаж пока нет.</li>`;

  const myReviews = reviews.filter((r) => r.sellerId === user.id);
  qs("#reviewsList").innerHTML = myReviews.length
    ? myReviews.map((r) => {
        const from = users.find((u) => u.id === r.buyerId);
        return `<li><span class="stars">${"★".repeat(r.rating)}</span> от ${from?.name || "покупателя"}</li>`;
      }).join("")
    : `<li>Отзывов пока нет.</li>`;

  const notifications = getNotifications().filter((n) => n.userId === user.id);
  qs("#notificationsList").innerHTML = notifications.length
    ? notifications.map((n) => `<li>${n.message}</li>`).join("")
    : `<li>Уведомлений нет.</li>`;
}

function initAccountPage() {
  const params = new URLSearchParams(location.search);
  const listingId = params.get("id");
  const listing = getListings().find((l) => l.id === listingId);
  const container = qs("#accountContainer");
  if (!listing) {
    container.innerHTML = `<p class="empty">Объявление не найдено.</p>`;
    return;
  }

  const seller = getUsers().find((u) => u.id === listing.sellerId);
  container.innerHTML = `
    <h2>${listing.game}</h2>
    <p class="meta">Уровень: ${listing.level}</p>
    <p class="meta">Персонажи / скины: ${listing.characters}</p>
    <p class="meta">Смена почты: ${listing.canChangeEmail ? "Доступна" : "Недоступна"}</p>
    <p>${listing.description}</p>
    <p class="price">${formatPrice(listing.price)}</p>
    <p class="meta">Продавец: ${seller?.name || "Неизвестно"}</p>
    <p class="meta">Рейтинг продавца: ${ratingOf(seller)}</p>
    <div id="buySection"></div>
  `;

  const user = getCurrentUser();
  const buySection = qs("#buySection");
  if (listing.status === "sold") {
    buySection.innerHTML = `<span class="status status-sold">Продан</span>`;
    return;
  }

  buySection.innerHTML = `<button id="buyBtn" class="btn btn-success">Купить</button>`;
  qs("#buyBtn").addEventListener("click", () => {
    if (!user) {
      alert("Войдите в аккаунт для покупки");
      return (location.href = "login.html");
    }
    if (user.id === seller.id) return alert("Нельзя купить собственное объявление");
    if (!confirm(`Подтвердить покупку за ${formatPrice(listing.price)}?`)) return;

    const listings = getListings();
    const target = listings.find((l) => l.id === listing.id);
    target.status = "sold";
    saveListings(listings);

    const purchases = getPurchases();
    purchases.push({
      id: id(),
      listingId: listing.id,
      sellerId: seller.id,
      buyerId: user.id,
      price: listing.price,
      createdAt: now()
    });
    savePurchases(purchases);

    const notifications = getNotifications();
    notifications.push({ id: id(), userId: seller.id, message: `Ваш аккаунт ${listing.game} был куплен пользователем ${user.name}.`, createdAt: now() });
    saveNotifications(notifications);

    const maybeRating = prompt("Оцените продавца от 1 до 5 звезд", "5");
    const rating = Number(maybeRating);
    if (rating >= 1 && rating <= 5) {
      const users = getUsers();
      const sellerUser = users.find((u) => u.id === seller.id);
      sellerUser.ratings.push(rating);
      saveUsers(users);

      const reviews = getReviews();
      reviews.push({ id: id(), sellerId: seller.id, buyerId: user.id, rating, createdAt: now() });
      saveReviews(reviews);
    }
    alert("Покупка успешно завершена!");
    location.reload();
  });
}

function bootstrap() {
  seedData();
  renderNav();

  if (page === "home") initHome();
  if (page === "login") initLogin();
  if (page === "profile") initProfile();
  if (page === "add") initAddListing();
  if (page === "account") initAccountPage();
}

bootstrap();
