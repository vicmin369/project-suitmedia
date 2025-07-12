document.addEventListener('DOMContentLoaded', () => {
    // === Elemen DOM ===
    const navbar = document.getElementById('navbar');
    const perPageSelect = document.getElementById('perPage');
    const sortBySelect = document.getElementById('sortBy');
    const postListContainer = document.getElementById('post-list');
    const paginationContainer = document.getElementById('pagination');

    // === State Management ===
    let lastScrollTop = 0;
    // URL API Asli TANPA PROXY
    const API_BASE_URL = 'https://suitmedia-backend.suitdev.com/api/ideas';

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
            // PERUBAHAN 1: Hanya menggunakan append 'medium_image'
            const params = new URLSearchParams({
                'page[number]': page,
                'page[size]': size,
                'sort': sort,
                'append[]': 'medium_image'
            });
            
            const response = await fetch(`${API_BASE_URL}?${params.toString()}`, {
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

            // Ambil URL gambar dari API, jika tidak ada, siapkan placeholder
            const imageUrl = post.medium_image?.[0]?.url;
            const placeholderUrl = 'https://placehold.co/300x200';

            card.innerHTML = `
                <img src="${imageUrl || placeholderUrl}" 
                     alt="${post.title}" 
                     class="card-thumbnail" 
                     loading="lazy">
                <div class="card-body">
                    <p class="card-date">${postDate}</p>
                    <h3 class="card-title">${post.title}</h3>
                </div>
            `;

            // === PERUBAHAN DIMULAI DI SINI ===

            // Cari elemen gambar yang baru saja kita buat
            const imgElement = card.querySelector('.card-thumbnail');

            // Tambahkan event listener 'onerror'
            // Ini akan berjalan jika 'src' gambar dari API gagal dimuat
            imgElement.onerror = () => {
                imgElement.src = placeholderUrl; // Ganti dengan gambar placeholder
            };
        
        // === PERUBAHAN SELESAI ===

            postListContainer.appendChild(card);
        });
    }
    
    // 3. Fungsi untuk membuat tombol pagination
    function renderPagination(meta) {
        paginationContainer.innerHTML = '';
        if (!meta || meta.last_page <= 1) return;

        const currentPage = meta.current_page;
        const totalPages = meta.last_page;

        // Tombol "Previous" (Anak Panah Kiri)
        const prevButton = document.createElement('button');
        prevButton.innerText = '«';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            fetchIdeas(currentPage - 1, itemsPerPage, sortBy);
        });
        paginationContainer.appendChild(prevButton);

        let lastPageRendered = 0;
        for (let i = 1; i <= totalPages; i++) {
            // Kondisi untuk menampilkan nomor halaman:
            // 1. Halaman pertama (i === 1)
            // 2. Halaman terakhir (i === totalPages)
            // 3. Halaman di sekitar halaman aktif (satu sebelum dan satu sesudah)
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            
                // Jika ada gap antara nomor terakhir yang ditampilkan, tambahkan elipsis "..."
                if (lastPageRendered !== 0 && i > lastPageRendered + 1) {
                    const ellipsis = document.createElement('span');
                    ellipsis.className = 'pagination-ellipsis';
                    ellipsis.innerText = '...';
                    paginationContainer.appendChild(ellipsis);
                }

                // Buat tombol halaman
                const pageButton = document.createElement('button');
                pageButton.innerText = i;
                if (i === currentPage) {
                    pageButton.className = 'active';
                }
                pageButton.addEventListener('click', () => {
                    if (i !== currentPage) {
                        fetchIdeas(i, itemsPerPage, sortBy);
                    }
                });
                paginationContainer.appendChild(pageButton);
                lastPageRendered = i;
            }
        }

        // Tombol "Next" (Anak Panah Kanan)
        const nextButton = document.createElement('button');
        nextButton.innerText = '»';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            fetchIdeas(currentPage + 1, itemsPerPage, sortBy);
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
