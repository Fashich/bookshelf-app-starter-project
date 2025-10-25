document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const logoutButton = document.getElementById('logout-button');
    const welcomeSection = document.getElementById('welcome-section');
    const appContainer = document.getElementById('app-container');
    const loginError = document.getElementById('login-error');
    const bookForm = document.getElementById('bookForm');
    const searchForm = document.getElementById('searchBook');
    const incompleteBookList = document.getElementById('incompleteBookList');
    const completeBookList = document.getElementById('completeBookList');
    const bookModal = document.getElementById('book-modal');
    const editModal = document.getElementById('edit-modal');
    const closeModalButtons = document.querySelectorAll('.close');
    const markReadButton = document.getElementById('mark-read');

    let currentUser = null;
    let isDemoMode = false;
    let currentBookId = null;

    let books = [];

    let readingIntervals = {};
    let lastScrollPositions = {};

    init();

    function init() {
        loadBooks();

        loginButton.addEventListener('click', () => {
            loginModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });

        loginForm.addEventListener('submit', handleLogin);
        logoutButton.addEventListener('click', handleLogout);
        bookForm.addEventListener('submit', handleAddBook);
        searchForm.addEventListener('submit', handleSearch);
        closeModalButtons.forEach(button => {
            button.addEventListener('click', () => {
                loginModal.style.display = 'none';
                bookModal.style.display = 'none';
                editModal.style.display = 'none';
                document.body.style.overflow = 'auto';

                if (currentBookId && readingIntervals[currentBookId]) {
                    clearInterval(readingIntervals[currentBookId]);
                    delete readingIntervals[currentBookId];
                }
            });
        });
        window.addEventListener('click', (event) => {
            if (event.target === loginModal ||
                event.target === bookModal ||
                event.target === editModal) {
                loginModal.style.display = 'none';
                bookModal.style.display = 'none';
                editModal.style.display = 'none';
                document.body.style.overflow = 'auto';

                if (currentBookId && readingIntervals[currentBookId]) {
                    clearInterval(readingIntervals[currentBookId]);
                    delete readingIntervals[currentBookId];
                }
            }
        });
        markReadButton.addEventListener('click', () => {
            if (!currentBookId) return;

            const book = books.find(b => b.id == currentBookId);
            if (book) {
                book.isRead = !book.isRead;
                book.readingProgress = book.isRead ? 100 : 0;
                updateReadingProgressInUI(currentBookId, book.readingProgress);
                saveBooks();

                bookModal.style.display = 'none';
                document.body.style.overflow = 'auto';

                renderBooks();
            }
        });

        const isUserLoggedIn = localStorage.getItem('isUserLoggedIn') === 'true';
        const isDemoUser = localStorage.getItem('isDemoUser') === 'true';

        if (isUserLoggedIn) {
            appContainer.style.display = 'block';
            document.body.style.overflow = 'auto';
            currentUser = { name: localStorage.getItem('userName') || 'User' };
            document.getElementById('user-greeting').textContent = `Welcome, ${currentUser.name}`;

            // Load books
            loadBooks();
            renderBooks();
            updateBookCounts();
        } else if (isDemoUser) {
            appContainer.style.display = 'block';
            document.body.style.overflow = 'auto';
            currentUser = { name: 'Demo User' };
            isDemoMode = true;
            document.getElementById('user-greeting').textContent = `Welcome, ${currentUser.name}`;

            loadDemoBooks();
            renderBooks();
            updateBookCounts();
        } else {
            welcomeSection.style.display = 'block';
        }
    }

    function handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === 'demo' && password === 'demo123') {
            loginModal.style.display = 'none';
            appContainer.style.display = 'block';
            document.body.style.overflow = 'auto';

            isDemoMode = true;
            localStorage.setItem('isDemoUser', 'true');
            localStorage.removeItem('isUserLoggedIn');

            currentUser = { name: 'Demo User' };
            document.getElementById('user-greeting').textContent = `Welcome, ${currentUser.name}`;

            welcomeSection.style.display = 'none';

            loadDemoBooks();
            renderBooks();
            updateBookCounts();
        } else if (username && password) {
            loginError.textContent = 'Invalid credentials. For demo, use username: demo and password: demo123';
            loginError.style.display = 'block';

            setTimeout(() => {
                loginError.style.display = 'none';
            }, 3000);
        }
    }

    function handleLogout() {
        localStorage.removeItem('isUserLoggedIn');
        localStorage.removeItem('userName');
        localStorage.removeItem('isDemoUser');

        if (isDemoMode) {
            localStorage.removeItem('bookshelf-books');
            books = [];
            renderBooks();
        }

        currentUser = null;
        isDemoMode = false;

        welcomeSection.style.display = 'block';
        appContainer.style.display = 'none';
        document.getElementById('user-greeting').textContent = 'Welcome, User';
    }

    function handleAddBook(e) {
        e.preventDefault();

        const title = document.getElementById('bookFormTitle').value;
        const author = document.getElementById('bookFormAuthor').value;
        const year = parseInt(document.getElementById('bookFormYear').value);
        const isComplete = document.getElementById('bookFormIsComplete').checked;

        if (!title || !author || !year) {
            alert('Please fill in all required fields');
            return;
        }

        const preProvidedBooks = [
            'Bikin Automation dari Nol sampai Jadi menggunakan n8n',
            'React + JSX: Building Modern Web Appilications',
            'Blockchain Developer In Industry 4.0',
            'Bikin 3D Object Menggunakan Phaser.js dan Three.js',
            'Bikin Game Makin Produktif dengan AI',
            'Cara Jago Ngoding Hanya Pake AI',
            'Malas Itu Bukan Penghalang'
        ];

        const isPreProvided = preProvidedBooks.includes(title);
        const isRead = isPreProvided ? false : false;
        const readingProgress = isPreProvided ? 0 : 0;

        const newBook = {
            id: Date.now().toString(),
            title,
            author,
            year,
            isComplete,
            isRead,
            readingProgress,
            content: isPreProvided ? getBookContent(title) : "This book does not have preloaded content. Add your own content in the future.",
            isPreProvided,
            isCustom: !isPreProvided
        };

        books.push(newBook);

        saveBooks();

        bookForm.reset();

        renderBooks();

        updateBookCounts();

        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = 'Book added successfully!';
        successMessage.style.position = 'fixed';
        successMessage.style.top = '20px';
        successMessage.style.right = '20px';
        successMessage.style.backgroundColor = '#16a34a';
        successMessage.style.color = 'white';
        successMessage.style.padding = '10px 20px';
        successMessage.style.borderRadius = '5px';
        successMessage.style.zIndex = '1000';

        document.body.appendChild(successMessage);

        setTimeout(() => {
            successMessage.style.display = 'none';
            document.body.removeChild(successMessage);
        }, 3000);
    }

    function handleSearch(e) {
        e.preventDefault();

        const searchTerm = document.getElementById('searchBookTitle').value.toLowerCase();

        if (!searchTerm) {
            renderBooks();
            return;
        }

        const filteredBooks = books.filter(book =>
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm)
        );

        renderBooks(filteredBooks);
    }

    function handleBookClick(e) {
        const bookItem = e.target.closest('.book-item');
        if (!bookItem) return;

        const bookId = bookItem.dataset.bookid;
        const book = books.find(b => b.id == bookId);

        if (book) {
            showBookDetail(book);
        }
    }

    function handleEditClick(e) {
        const bookItem = e.target.closest('.book-item');
        if (!bookItem) return;

        const bookId = bookItem.dataset.bookid;
        const book = books.find(b => b.id == bookId);

        if (book && !book.isPreProvided) {
            document.getElementById('editTitle').value = book.title;
            document.getElementById('editAuthor').value = book.author;
            document.getElementById('editYear').value = book.year;
            document.getElementById('editIsComplete').value = book.isComplete.toString();
            document.getElementById('editForm').dataset.bookid = book.id;

            editModal.style.display = 'block';
            document.body.style.overflow = 'auto';
        }
    }

    function handleEditSubmit(e) {
        e.preventDefault();

        const bookId = document.getElementById('editForm').dataset.bookid;
        const book = books.find(b => b.id == bookId);

        if (book) {
            book.title = document.getElementById('editTitle').value;
            book.author = document.getElementById('editAuthor').value;
            book.year = parseInt(document.getElementById('editYear').value);
            book.isComplete = document.getElementById('editIsComplete').value === 'true';

            saveBooks();

            editModal.style.display = 'none';
            document.body.style.overflow = 'auto';

            renderBooks();

            updateBookCounts();
        }
    }

    function handleStatusToggle(e) {
        const button = e.target;
        const bookItem = button.closest('.book-item');
        if (!bookItem) return;

        const bookId = bookItem.dataset.bookid;
        const book = books.find(b => b.id == bookId);

        if (book) {
            book.isComplete = !book.isComplete;

            saveBooks();

            renderBooks();

            updateBookCounts();
        }
    }

    function handleDelete(e) {
        const button = e.target;
        const bookItem = button.closest('.book-item');
        if (!bookItem) return;

        const bookId = bookItem.dataset.bookid;

        if (confirm('Apakah Anda yakin ingin menghapus buku ini?')) {
            books = books.filter(book => book.id != bookId);

            saveBooks();

            renderBooks();

            updateBookCounts();
        }
    }

    function showBookDetail(book) {
        // Update modal content
        document.getElementById('modal-book-title').textContent = book.title;
        document.getElementById('modal-book-author').textContent = book.author;
        document.getElementById('modal-book-year').textContent = `Tahun: ${book.year}`;
        document.getElementById('modal-book-status').textContent =
            book.isComplete ? 'Selesai dibaca' : 'Belum selesai dibaca';

        const coverImage = getBookCover(book.title);
        document.getElementById('modal-book-cover').src = coverImage;

        const contentElement = document.getElementById('book-content-placeholder');
        contentElement.innerHTML = formatBookContent(book.content);

        document.getElementById('progress-fill').style.width = `${book.readingProgress}%`;
        document.getElementById('progress-percentage').textContent = `${book.readingProgress}%`;

        document.getElementById('mark-read').textContent = book.isRead ? "Tandai sebagai belum dibaca" : "Tandai sebagai dibaca";

        currentBookId = book.id;

        if (readingIntervals[book.id]) {
            clearInterval(readingIntervals[book.id]);
        }

        lastScrollPositions[book.id] = 0;
        readingIntervals[book.id] = setInterval(() => {
            const content = document.getElementById('book-content-placeholder');
            if (!content) return;

            const scrollHeight = content.scrollHeight - content.clientHeight;
            const scrollPosition = content.scrollTop;

            if (scrollHeight > 0) {
                const progress = Math.min(100, Math.max(0, Math.round((scrollPosition / scrollHeight) * 100)));

                if (Math.abs(progress - book.readingProgress) > 2) {
                    book.readingProgress = progress;
                    document.getElementById('progress-fill').style.width = `${progress}%`;
                    document.getElementById('progress-percentage').textContent = `${progress}%`;
                    updateReadingProgressInUI(book.id, progress);
                    saveBooks();
                }
            }
        }, 200);

        bookModal.style.display = 'block';
        document.body.style.overflow = 'auto';
    }

    function updateReadingProgressInUI(bookId, progress) {
        const bookElement = document.querySelector(`.book-item[data-bookid="${bookId}"]`);
        if (bookElement) {
            const progressBar = bookElement.querySelector('.progress-bar .progress-fill');
            const progressPercentage = bookElement.querySelector('.progress-text span');

            if (progressBar && progressPercentage) {
                progressBar.style.width = `${progress}%`;
                progressPercentage.textContent = `${progress}%`;
            }
        }
    }

    function updateBookCounts() {
        const incompleteCount = books.filter(b => !b.isComplete).length;
        const completeCount = books.filter(b => b.isComplete).length;

        document.getElementById('incomplete-count').textContent = `${incompleteCount} buku`;
        document.getElementById('complete-count').textContent = `${completeCount} buku`;
    }

    function renderBooks(booksToRender = books) {
        incompleteBookList.innerHTML = '';
        completeBookList.innerHTML = '';

        booksToRender.forEach((book, index) => {
            const bookElement = createBookElement(book, index);

            if (book.isComplete) {
                completeBookList.appendChild(bookElement);
            } else {
                incompleteBookList.appendChild(bookElement);
            }
        });

        document.querySelectorAll('.book-item').forEach(item => {
            item.addEventListener('click', handleBookClick);
        });

        document.querySelectorAll('.book-item-edit-button').forEach(button => {
            button.addEventListener('click', handleEditClick);
        });

        document.querySelectorAll('.book-item-is-complete-button').forEach(button => {
            button.addEventListener('click', handleStatusToggle);
        });

        document.querySelectorAll('.book-item-delete-button').forEach(button => {
            button.addEventListener('click', handleDelete);
        });
    }

    function createBookElement(book, index) {
        const bookElement = document.createElement('div');
        bookElement.className = 'book-item';
        bookElement.dataset.bookid = book.id;
        bookElement.dataset.testid = 'bookItem';
        bookElement.style.setProperty('--index', index);

        const cover = getBookCover(book.title);

        bookElement.innerHTML = `
            <div class="book-content">
                <h3 data-testid="bookItemTitle">${book.title}</h3>
                <p data-testid="bookItemAuthor">Penulis: ${book.author}</p>
                <p data-testid="bookItemYear">Tahun: ${book.year}</p>
                <div class="book-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${book.readingProgress}%"></div>
                    </div>
                    <div class="progress-text">Progress: ${book.readingProgress}%</div>
                </div>
                <div class="actions">
                    ${!book.isPreProvided ? '<button class="btn-edit" data-testid="bookItemEditButton">Edit</button>' : ''}
                    <button class="btn-primary" data-testid="bookItemIsCompleteButton">${book.isComplete ? 'Belum selesai' : 'Selesai dibaca'}</button>
                    <button class="btn-delete" data-testid="bookItemDeleteButton">Hapus</button>
                </div>
            </div>
        `;

        return bookElement;
    }

    function getBookCover(title) {
        const covers = {
            'Bikin Automation dari Nol sampai Jadi menggunakan n8n': 'images/Bookshelf/buku-1.png',
            'React + JSX: Building Modern Web Appilications': 'images/Bookshelf/buku-2.png',
            'Blockchain Developer In Industry 4.0': 'images/Bookshelf/buku-3.png',
            'Bikin 3D Object Menggunakan Phaser.js dan Three.js': 'images/Bookshelf/buku-4.png',
            'Bikin Game Makin Produktif dengan AI': 'images/Bookshelf/buku-5.png',
            'Cara Jago Ngoding Hanya Pake AI': 'images/Bookshelf/buku-6.png',
            'Malas Itu Bukan Penghalang': 'images/Bookshelf/buku-7.png'
        };

        return covers[title] || 'images/Bookshelf/buku-1.png';
    }

    function getBookContent(title) {
        const booksData = {
            'Bikin Automation dari Nol sampai Jadi menggunakan n8n': `Preface\nIn an era where digital transformation is no longer optional but a critical determinant of organizational resilience and competitiveness, the ability to automate repetitive, time-consuming tasks has become a cornerstone of modern operational efficiency. The rise of low-code and no-code platforms has democratized automation, enabling professionals across diverse technical backgrounds to design sophisticated workflows without requiring deep programming expertise. Among these tools, n8n stands out as a powerful, open-source workflow automation platform that combines flexibility, scalability, and an intuitive interface to empower users to orchestrate complex processes with remarkable ease. This book, Bikin Automation dari Nol sampai Jadi menggunakan n8n, is designed to serve as a comprehensive guide for individuals and teams seeking to harness the full potential of n8n, from foundational concepts to advanced implementations, while navigating the nuances of real-world automation challenges.`,
            'React + JSX: Building Modern Web Appilications': `Preface: The Evolution and Imperative of React in Contemporary Development\nThe landscape of web application development has undergone a profound transformation over the past decade, shifting from static, server-rendered pages to dynamic, interactive single-page applications that rival the responsiveness of native desktop software. This paradigm shift was not merely driven by user expectations for richer experiences but by the fundamental limitations of traditional DOM manipulation techniques, which proved cumbersome, error-prone, and inefficient when managing complex, data-driven interfaces. The advent of JavaScript frameworks and libraries sought to address these challenges, yet many early solutions introduced their own layers of complexity, steep learning curves, and significant performance overhead, often constraining developer productivity rather than enhancing it. It was within this context of burgeoning demand for more maintainable and scalable front-end architectures that React, initially developed and open-sourced by Facebook in 2013, emerged as a revolutionary force, not by dictating an entire application structure, but by providing a focused, component-based approach to building user interfaces. React's core innovation lay in its elegant abstraction of the DOM through the concept of a virtual representation, coupled with a declarative programming model that allowed developers to describe what the UI should look like for any given state, rather than meticulously scripting how to achieve state transitions through imperative DOM mutations. This fundamental shift in thinking significantly reduced the cognitive load associated with managing UI state and interactions, leading to more predictable codebases and fewer subtle bugs.`,
            'Blockchain Developer In Industry 4.0': `Preface: The Convergence Imperative\nThe Fourth Industrial Revolution is not a distant prospect; it is the operational reality reshaping factories, supply chains, and global markets today. Driven by the confluence of cyber-physical systems, the Internet of Things, cloud computing, and artificial intelligence, Industry 4.0 promises unprecedented levels of efficiency, customization, and connectivity. Yet, this hyper-connected, data-driven landscape introduces profound challenges: ensuring data integrity across complex, multi-party ecosystems; establishing verifiable trust between autonomous machines; securing critical infrastructure against increasingly sophisticated threats; and managing the sheer volume and velocity of industrial data with absolute reliability. Traditional centralized systems, while robust in their time, are increasingly strained by the demands of real-time collaboration, transparency, and security required by modern industrial operations. This is where blockchain technology emerges not as a buzzword, but as a foundational enabler. Blockchain offers the cryptographic security, immutable record-keeping, and decentralized trust mechanisms essential for realizing the full potential of Industry 4.0. It provides the bedrock upon which verifiable data provenance, automated smart contracts, and secure machine-to-machine interactions can flourish.`,
            'Bikin 3D Object Menggunakan Phaser.js dan Three.js': `Preface\nThe digital landscape has undergone a transformative shift as 3D content transitions from niche applications to mainstream web experiences. From immersive e-commerce product previews to interactive educational tools, the demand for dynamic 3D objects is no longer confined to gaming or specialized industries. This book, Bikin 3D Object Menggunakan Phaser.js dan Three.js, emerges at a pivotal moment when JavaScript frameworks have matured to the point where creating sophisticated 3D experiences is accessible to developers of varying expertise. The title, which translates to Creating 3D Objects Using Phaser.js and Three.js, reflects a dual focus: leveraging Phaser.js's simplicity for lightweight 2.5D applications and harnessing Three.js's comprehensive toolkit for full-fledged 3D projects.`,
            'Bikin Game Makin Produktif dengan AI': `Preface\nThe modern game development landscape stands at a pivotal intersection of creativity and computational power, where the relentless demand for innovation collides with the constraints of time, budget, and human resources. As studios—from indie teams working with shoestring budgets to AAA giants managing sprawling franchises—grapple with increasingly complex projects, the integration of artificial intelligence has emerged not as a futuristic fantasy but as a pragmatic necessity. This book, Bikin Game Makin Produktif dengan AI, is born from the urgent need to bridge the gap between theoretical AI capabilities and their actionable application in real-world game development workflows. It is not a treatise on replacing human ingenuity with algorithms, nor a superficial guide to trendy tools; rather, it is a meticulously crafted roadmap for leveraging AI to amplify productivity while preserving the soul of game design.`,
            'Cara Jago Ngoding Hanya Pake AI': `Preface\nThe landscape of software development is undergoing a seismic shift, one where the barrier to entry is no longer a four-year computer science degree but the willingness to engage with tools that transform ideas into functional code. Cara Jago Ngoding Hanya Pake AI emerges at this pivotal moment, challenging the outdated notion that coding is an exclusive domain for the technically elite. For decades, the narrative surrounding programming has been steeped in jargon, steep learning curves, and gatekeeping—a reality that has deterred countless innovators from bringing their visions to life. Yet, the rise of generative AI has rewritten the rules, placing the power of creation in the hands of anyone with a problem to solve and a device to access these tools. This book is not just a technical manual; it is a manifesto for a new era of democratized development, where the focus shifts from memorizing syntax to mastering the art of collaboration with artificial intelligence.`,
            'Malas Itu Bukan Penghalang': `Preface: Reframing the Unseen Ally\nThe persistent hum of societal expectation often labels a quiet resistance within us as "malas" – laziness. This judgment, whispered in the corridors of our own minds or echoed by the world around us, carries a heavy burden of shame and inadequacy. We are conditioned to believe that constant motion, relentless productivity, and unwavering motivation are the only paths to value and success. This book, Malas Itu Bukan Penghalang, begins with a radical proposition: what if the sensation we call "malas" is not an enemy to be vanquished, but a vital signal, a misunderstood ally guiding us towards a more sustainable, authentic, and ultimately more productive way of being? It is not an excuse for inaction, but a profound indicator demanding our attention. For too long, we have waged war against this internal state, draining our energy in futile battles against our own natural rhythms and psychological needs. This struggle, this internal conflict, is often the true obstacle, not the "malas" itself. This book seeks to dismantle the stigma, moving beyond simplistic moral judgments to explore the complex neurobiological, psychological, and cultural roots of what we perceive as laziness.`
        };

        return booksData[title] || `Content for ${title} would appear here. This book explores the essential concepts of modern development and provides practical guidance for implementation.`;
    }

    function formatBookContent(content) {
        return content
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^([A-Z][^.]+\.)/g, '<h3>$1</h3>');
    }

    function saveBooks() {
        if (!isDemoMode) {
            localStorage.setItem('bookshelf-books', JSON.stringify(books));
        }
    }

    function loadBooks() {
        if (!isDemoMode) {
            const savedBooks = localStorage.getItem('bookshelf-books');
            if (savedBooks) {
                books = JSON.parse(savedBooks);
                return;
            }
        }

        loadDemoBooks();
    }

    function loadDemoBooks() {
        books = [
            {
                id: '1',
                title: 'Bikin Automation dari Nol sampai Jadi menggunakan n8n',
                author: 'Author 1',
                year: 2022,
                isComplete: false,
                isRead: false,
                readingProgress: 0,
                content: getBookContent('Bikin Automation dari Nol sampai Jadi menggunakan n8n'),
                isPreProvided: true,
                isCustom: false
            },
            {
                id: '2',
                title: 'React + JSX: Building Modern Web Appilications',
                author: 'Author 2',
                year: 2021,
                isComplete: true,
                isRead: true,
                readingProgress: 100,
                content: getBookContent('React + JSX: Building Modern Web Appilications'),
                isPreProvided: true,
                isCustom: false
            },
            {
                id: '3',
                title: 'Blockchain Developer In Industry 4.0',
                author: 'Author 3',
                year: 2023,
                isComplete: false,
                isRead: false,
                readingProgress: 45,
                content: getBookContent('Blockchain Developer In Industry 4.0'),
                isPreProvided: true,
                isCustom: false
            },
            {
                id: '4',
                title: 'Bikin 3D Object Menggunakan Phaser.js dan Three.js',
                author: 'Author 4',
                year: 2022,
                isComplete: false,
                isRead: false,
                readingProgress: 0,
                content: getBookContent('Bikin 3D Object Menggunakan Phaser.js dan Three.js'),
                isPreProvided: true,
                isCustom: false
            },
            {
                id: '5',
                title: 'Bikin Game Makin Produktif dengan AI',
                author: 'Author 5',
                year: 2023,
                isComplete: true,
                isRead: true,
                readingProgress: 100,
                content: getBookContent('Bikin Game Makin Produktif dengan AI'),
                isPreProvided: true,
                isCustom: false
            },
            {
                id: '6',
                title: 'Cara Jago Ngoding Hanya Pake AI',
                author: 'Author 6',
                year: 2022,
                isComplete: true,
                isRead: false,
                readingProgress: 75,
                content: getBookContent('Cara Jago Ngoding Hanya Pake AI'),
                isPreProvided: true,
                isCustom: false
            },
            {
                id: '7',
                title: 'Malas Itu Bukan Penghalang',
                author: 'Author 7',
                year: 2023,
                isComplete: false,
                isRead: false,
                readingProgress: 25,
                content: getBookContent('Malas Itu Bukan Penghalang'),
                isPreProvided: true,
                isCustom: false
            }
        ];
    }

    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-testid="bookItemEditButton"]')) {
            handleEditClick(e);
        } else if (e.target.matches('[data-testid="bookItemIsCompleteButton"]')) {
            handleStatusToggle(e);
        } else if (e.target.matches('[data-testid="bookItemDeleteButton"]')) {
            handleDelete(e);
        }
    });

    updateBookCounts();
});