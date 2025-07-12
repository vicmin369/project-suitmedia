document.addEventListener('DOMContentLoaded', () => {
    // === Elemen DOM ===
    const navbar = document.getElementById('navbar');
    const perPageSelect = document.getElementById('perPage');
    const sortBySelect = document.getElementById('sortBy');
    const postListContainer = document.getElementById('post-list');
    const paginationContainer = document.getElementById('pagination');

    // === State Management ===
    let lastScrollTop = 0;
    
    // 1. PENGATURAN PROXY (Sesuai instruksi)
    // Menggunakan proxy publik untuk menangani potensi CORS di lingkungan web.
    const PROXY_URL = 'https://corsproxy.io/?';
    const API_URL = 'https://suitmedia-backend.suitdev.com/api/ideas';
    const API_BASE_URL = `${PROXY_URL}${encodeURIComponent(API_URL)}`;

    // Mendapatkan state dari URL atau menggunakan nilai default
    const urlParams = new URLSearchParams(window.location.search);
    let currentPage = parseInt(urlParams.get('page')) || 1;
    let itemsPerPage = parseInt(urlParams.get('per_page')) || 10;
    let sortBy = urlParams.get('sort') || '-published_at';

    // Atur nilai dropdown sesuai state saat ini
    perPageSelect.value = itemsPerPage;
    sortBySelect.value = sortBy;

    // === Fungsi-Fungsi ===
    async function fetchIdeas(page, size, sort) {
        postListContainer.innerHTML = '<p>Loading posts...</p>';
        try {
            // 2. MENGGUNAKAN SEMUA PARAMS (Sesuai instruksi)
            const params = new URLSearchParams({
                'page[number]': page,
                'page[size]': size,
                'sort': sort,
                'append[]': ['small_image', 'medium_image'] // Termasuk append
            });
            
            const response = await fetch(`${API_BASE_URL}&${params.toString()}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            renderPosts(data.data);
            renderPagination(data.meta);
            updateURL(page, size, sort);

        } catch (error) {
            console.error("Could not fetch ideas:", error);
            postListContainer.innerHTML = `<p>Failed to load posts. ${error.message}</p>`;
        }
    }

    function renderPosts(posts) {
        if (!posts || posts.length === 0) {
            postListContainer.innerHTML = '<p>No posts found.</p>';
            return;
        }

        postListContainer.innerHTML = '';
        posts.forEach(post => {
            const postDate = new Date(post.published_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${post.small_image?.[0]?.url || ''}" 
                     alt="${post.title}" 
                     class="card-thumbnail" 
                     loading="lazy">
                <div class="card-body">
                    <p class="card-date">${postDate}</p>
                    <h3 class="card-title">${post.title}</h3>
                </div>
            `;
            postListContainer.appendChild(card);
        });
    }
    
    function renderPagination(meta) {
        paginationContainer.innerHTML = '';
        if (!meta || meta.last_page <= 1) return;

        const prevButton = document.createElement('button');
        prevButton.innerText = '«';
        prevButton.disabled = meta.current_page === 1;
        prevButton.addEventListener('click', () => {
            fetchIdeas(meta.current_page - 1, itemsPerPage, sortBy);
        });
        paginationContainer.appendChild(prevButton);
        
        for (let i = 1; i <= meta.last_page; i++) {
            const pageButton = document.createElement('button');
            pageButton.innerText = i;
            if (i === meta.current_page) {
                pageButton.className = 'active';
            }
            pageButton.addEventListener('click', () => {
                if (i !== meta.current_page) {
                    fetchIdeas(i, itemsPerPage, sortBy);
                }
            });
            paginationContainer.appendChild(pageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.innerText = '»';
        nextButton.disabled = meta.current_page === meta.last_page;
        nextButton.addEventListener('click', () => {
            fetchIdeas(meta.current_page + 1, itemsPerPage, sortBy);
        });
        paginationContainer.appendChild(nextButton);
    }
    
    function updateURL(page, size, sort) {
        const newUrl = `${window.location.pathname}?page=${page}&per_page=${size}&sort=${sort}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
        currentPage = page;
        itemsPerPage = size;
        sortBy = sort;
    }

    // === Event Listeners ===
    window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop && scrollTop > 70) {
            navbar.style.top = '-80px';
        } else {
            navbar.style.top = '0';
            if (scrollTop > 0) {
                 navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            } else {
                 navbar.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            }
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, false);

    perPageSelect.addEventListener('change', (e) => {
        const newSize = parseInt(e.target.value);
        fetchIdeas(1, newSize, sortBy);
    });

    sortBySelect.addEventListener('change', (e) => {
        const newSort = e.target.value;
        fetchIdeas(1, itemsPerPage, newSort);
    });

    // === Panggilan Awal ===
    fetchIdeas(currentPage, itemsPerPage, sortBy);
});
