// ======================
// AUTHENTICATION SYSTEM
// ======================

function initAuth() {
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    showBookshelf();
    loadBooks();
  } else {
    showAuthForms();
  }
}

function showAuthForms() {
  document.querySelector('header').style.display = 'flex';
  document.querySelector('main').style.display = 'none';
  document.getElementById('logoutButton').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
}

function showBookshelf() {
  document.querySelector('header').style.display = 'flex';
  document.querySelector('main').style.display = 'block';
  document.getElementById('logoutButton').style.display = 'inline-block';
  document.getElementById('auth-container').style.display = 'none';
}

function registerUser(username, password) {
  let users = JSON.parse(localStorage.getItem('users')) || [];
  if (users.some(user => user.username === username)) {
    alert('Username sudah digunakan. Silakan pilih username lain.');
    return false;
  }

  const newUser = {
    id: Date.now().toString(),
    username: username,
    password: password
  };

  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  return true;
}

function loginUser(username, password) {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    localStorage.setItem('currentUser', user.id);
    return true;
  }
  return false;
}

function logoutUser() {
  localStorage.removeItem('currentUser');
  showAuthForms();
}

// ======================
// BOOK MANAGEMENT
// ======================

function getBooks() {
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) return [];

  const key = `books_${currentUser}`;
  return JSON.parse(localStorage.getItem(key)) || [];
}

function saveBooks(books) {
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) return;

  const key = `books_${currentUser}`;
  localStorage.setItem(key, JSON.stringify(books));
}

function addBook(title, author, year, isComplete) {
  const books = getBooks();
  const newBook = {
    id: Date.now().toString(),
    title: title,
    author: author,
    year: parseInt(year),
    isComplete: isComplete
  };

  books.push(newBook);
  saveBooks(books);
  return newBook;
}

function updateBook(bookId, updatedData) {
  const books = getBooks();
  const index = books.findIndex(book => book.id === bookId);

  if (index !== -1) {
    books[index] = { ...books[index], ...updatedData };
    saveBooks(books);
    return true;
  }

  return false;
}

function deleteBook(bookId) {
  const books = getBooks().filter(book => book.id !== bookId);
  saveBooks(books);
}

function toggleBookStatus(bookId) {
  const books = getBooks();
  const book = books.find(book => book.id === bookId);

  if (book) {
    book.isComplete = !book.isComplete;
    saveBooks(books);
    return book;
  }

  return null;
}

// ======================
// UI RENDERING
// ======================

function renderBooks(books = null) {
  if (books === null) {
    books = getBooks();
  }

  const incompleteList = document.getElementById('incompleteBookList');
  const completeList = document.getElementById('completeBookList');

  incompleteList.innerHTML = '';
  completeList.innerHTML = '';

  books.forEach(book => {
    const bookElement = createBookElement(book);

    if (book.isComplete) {
      completeList.appendChild(bookElement);
    } else {
      incompleteList.appendChild(bookElement);
    }
  });
}

function createBookElement(book) {
  const container = document.createElement('div');
  container.setAttribute('data-bookid', book.id);
  container.setAttribute('data-testid', 'bookItem');

  container.innerHTML = `
    <h3 data-testid="bookItemTitle">${book.title}</h3>
    <p data-testid="bookItemAuthor">Penulis: ${book.author}</p>
    <p data-testid="bookItemYear">Tahun: ${book.year}</p>
    <div>
      <button data-testid="bookItemIsCompleteButton">${book.isComplete ? 'Belum selesai dibaca' : 'Selesai dibaca'}</button>
      <button data-testid="bookItemDeleteButton">Hapus Buku</button>
      <button data-testid="bookItemEditButton">Edit Buku</button>
    </div>
  `;

  // Add event listeners
  container.querySelector('[data-testid="bookItemIsCompleteButton"]').addEventListener('click', () => {
    const updatedBook = toggleBookStatus(book.id);
    if (updatedBook) {
      renderBooks();
    }
  });

  container.querySelector('[data-testid="bookItemDeleteButton"]').addEventListener('click', () => {
    deleteBook(book.id);
    renderBooks();
  });

  container.querySelector('[data-testid="bookItemEditButton"]').addEventListener('click', () => {
    openEditModal(book);
  });

  return container;
}

function openEditModal(book) {
  document.getElementById('editBookId').value = book.id;
  document.getElementById('editTitle').value = book.title;
  document.getElementById('editAuthor').value = book.author;
  document.getElementById('editYear').value = book.year;
  document.getElementById('editIsComplete').checked = book.isComplete;

  document.getElementById('editModal').style.display = 'block';
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
}

function handleEditSubmit(e) {
  e.preventDefault();

  const bookId = document.getElementById('editBookId').value;
  const updatedBook = {
    title: document.getElementById('editTitle').value,
    author: document.getElementById('editAuthor').value,
    year: parseInt(document.getElementById('editYear').value),
    isComplete: document.getElementById('editIsComplete').checked
  };

  if (updateBook(bookId, updatedBook)) {
    renderBooks();
    closeEditModal();
  }
}

function handleAddBook(e) {
  e.preventDefault();

  const title = document.getElementById('bookFormTitle').value;
  const author = document.getElementById('bookFormAuthor').value;
  const year = document.getElementById('bookFormYear').value;
  const isComplete = document.getElementById('bookFormIsComplete').checked;

  addBook(title, author, year, isComplete);
  renderBooks();

  // Reset form
  document.getElementById('bookForm').reset();
}

function handleSearch(e) {
  e.preventDefault();

  const searchTerm = document.getElementById('searchBookTitle').value.toLowerCase();
  const books = getBooks();

  if (!searchTerm) {
    renderBooks();
    return;
  }

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm)
  );

  renderBooks(filteredBooks);
}

// ======================
// EVENT LISTENERS
// ======================

document.addEventListener('DOMContentLoaded', function() {
  initAuth();

  // Auth events
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (loginUser(username, password)) {
      showBookshelf();
      loadBooks();
    } else {
      alert('Username atau password salah. Silakan coba lagi.');
    }
  });

  document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    if (registerUser(username, password)) {
      alert('Registrasi berhasil! Silakan login dengan akun Anda.');
      showLoginForm();
    }
  });

  document.getElementById('showRegister').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
  });

  document.getElementById('showLogin').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
  });

  document.getElementById('logoutButton').addEventListener('click', logoutUser);

  // Book events
  document.getElementById('bookForm').addEventListener('submit', handleAddBook);
  document.getElementById('searchBook').addEventListener('submit', handleSearch);
  document.querySelector('.close')?.addEventListener('click', closeEditModal);
  document.getElementById('editBookForm').addEventListener('submit', handleEditSubmit);

  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
      closeEditModal();
    }
  });
});

function loadBooks() {
  renderBooks();
}