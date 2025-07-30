const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const resultsDiv = document.getElementById('results');
const toggleThemeBtn = document.getElementById('theme-toggle');
const toggleFavsBtn = document.getElementById('toggle-favs');
const emptyState = document.getElementById('empty-state');

let showFavorites = false;

// Show empty state initially
emptyState.classList.remove('hidden');
resultsDiv.classList.add('hidden');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) return;
  
  try {
    emptyState.classList.add('hidden');
    resultsDiv.classList.remove('hidden');
    resultsDiv.innerHTML = '<div class="col-span-full text-center py-8"><i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i></div>';
    
    const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    renderBooks(data.docs.slice(0, 12));
  } catch (error) {
    resultsDiv.innerHTML = `
      <div class="col-span-full text-center py-8">
        <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-3"></i>
        <p class="text-red-500">Failed to fetch books. Please try again.</p>
      </div>
    `;
  }
});

function renderBooks(books) {
  if (books.length === 0) {
    resultsDiv.innerHTML = `
      <div class="col-span-full text-center py-8">
        <i class="fas fa-book-dead text-3xl text-gray-400 mb-3"></i>
        <p>No books found. Try a different search.</p>
      </div>
    `;
    return;
  }

  resultsDiv.innerHTML = '';
  
  books.forEach((book, index) => {
    const isFav = getFavorites().some(fav => fav.key === book.key);
    const coverId = book.cover_i;
    const coverUrl = coverId 
      ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` 
      : 'https://via.placeholder.com/150x200?text=No+Cover';
    
    const div = document.createElement('div');
    div.className = `book-card p-4 rounded-xl shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 flex flex-col`;
    div.innerHTML = `
      <div class="flex-shrink-0 mb-4 overflow-hidden rounded-lg">
        <img src="${coverUrl}" alt="${book.title}" class="w-full h-48 object-cover hover:scale-105 transition-transform duration-300">
      </div>
      <div class="flex-grow">
        <h2 class="text-lg font-semibold line-clamp-2 mb-1">${book.title}</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">${book.author_name?.join(', ') || "Unknown author"}</p>
        <p class="text-xs text-gray-400 dark:text-gray-500 mb-3">First published: ${book.first_publish_year || 'Unknown'}</p>
      </div>
      <button class="mt-auto fav-btn px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isFav 
          ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50' 
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'
      }">
        <i class="fas fa-heart mr-2 ${isFav ? 'text-red-500' : 'text-blue-500'}"></i>
        ${isFav ? 'Remove Favorite' : 'Add Favorite'}
      </button>
    `;

    const favBtn = div.querySelector('.fav-btn');
    favBtn.addEventListener('click', () => {
      toggleFavorite(book);
      renderBooks(books);
    });

    resultsDiv.appendChild(div);
  });
}

function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites') || '[]');
}

function toggleFavorite(book) {
  let favs = getFavorites();
  const exists = favs.some(fav => fav.key === book.key);
  if (exists) {
    favs = favs.filter(fav => fav.key !== book.key);
    showToast('Removed from favorites', 'red');
  } else {
    favs.push(book);
    showToast('Added to favorites', 'blue');
  }
  localStorage.setItem('favorites', JSON.stringify(favs));
}

function showToast(message, color) {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white bg-${color}-500 dark:bg-${color}-600 flex items-center gap-2 transition-all duration-300 transform translate-y-10 opacity-0`;
  toast.innerHTML = `
    <i class="fas ${color === 'red' ? 'fa-heart-crack' : 'fa-heart'}"></i>
    ${message}
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.remove('translate-y-10', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

toggleThemeBtn.addEventListener('click', () => {
  const html = document.documentElement;
  const newTheme = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});

// Check for saved theme preference
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
}

toggleFavsBtn.addEventListener('click', () => {
  showFavorites = !showFavorites;
  toggleFavsBtn.innerHTML = showFavorites 
    ? '<i class="fas fa-search mr-2"></i>Back to Search' 
    : '<i class="fas fa-heart mr-2"></i>View Favorites';
  
  if (showFavorites) {
    const favs = getFavorites();
    if (favs.length > 0) {
      renderBooks(favs);
      emptyState.classList.add('hidden');
      resultsDiv.classList.remove('hidden');
    } else {
      resultsDiv.innerHTML = `
        <div class="col-span-full text-center py-8">
          <i class="fas fa-heart-broken text-3xl text-pink-500 mb-3"></i>
          <p>No favorites yet. Search for books to add some!</p>
        </div>
      `;
      emptyState.classList.add('hidden');
      resultsDiv.classList.remove('hidden');
    }
  } else {
    resultsDiv.innerHTML = '';
    emptyState.classList.remove('hidden');
    resultsDiv.classList.add('hidden');
  }
});

