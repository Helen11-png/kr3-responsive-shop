// main.js — КР №3.
// JavaScript здесь вспомогательный: адаптивное меню, фильтр-«гармошка»,
// модальное окно и доступные сообщения об ошибках формы.
// Основная работа КР №3 — в HTML и CSS (css/responsive.css).

// ---------- 1. Адаптивное меню ----------
// На мобильном меню свёрнуто. Кнопка «Меню» раскрывает его,
// а атрибут aria-expanded сообщает экранному диктору, раскрыто меню или нет.
const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.getElementById('site-nav');
const desktopQuery = window.matchMedia('(min-width: 768px)');

function setMenuOpen(isOpen) {
  siteNav.classList.toggle('is-open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
}

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    setMenuOpen(!isOpen);
  });

  // Escape закрывает меню и возвращает фокус на кнопку.
  document.addEventListener('keydown', (event) => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    if (event.key === 'Escape' && isOpen) {
      setMenuOpen(false);
      navToggle.focus();
    }
  });

  // После перехода по ссылке на этой же странице (якорь) меню закрываем.
  siteNav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      setMenuOpen(false);
    }
  });

  // При переходе на широкий экран меню должно быть сброшено в исходное состояние.
  desktopQuery.addEventListener('change', (event) => {
    if (event.matches) {
      setMenuOpen(false);
    }
  });
}

// ---------- 2. Фильтр каталога: свёрнут на мобильном, раскрыт на ПК ----------
const catalogFilters = document.querySelector('.catalog-filters details');
const wideQuery = window.matchMedia('(min-width: 1024px)');

if (catalogFilters) {
  const syncFilters = () => {
    catalogFilters.open = wideQuery.matches;
  };

  syncFilters();
  wideQuery.addEventListener('change', syncFilters);
}

// ---------- 3. Модальное окно ----------
const orderDialog = document.getElementById('order-dialog');
const orderButtons = document.querySelectorAll('.product-card__button');
const closeDialogButton = document.getElementById('close-order-dialog');
const selectedProductInput = document.getElementById('selected-product');

if (orderDialog) {
  orderButtons.forEach((button) => {
    button.addEventListener('click', () => {
      // Название товара из data-атрибута записываем в скрытое поле формы.
      if (selectedProductInput) {
        selectedProductInput.value = button.dataset.product;
      }
      // showModal() сам переводит фокус в окно, блокирует страницу под ним
      // и закрывает окно по клавише Escape.
      orderDialog.showModal();
    });
  });

  if (closeDialogButton) {
    closeDialogButton.addEventListener('click', () => orderDialog.close());
  }

  // Клик по затемнённому фону (за пределами окна) тоже закрывает окно.
  orderDialog.addEventListener('click', (event) => {
    const rect = orderDialog.getBoundingClientRect();
    const isOutside =
      event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;

    if (isOutside) {
      orderDialog.close();
    }
  });
}

// ---------- 4. Формы: проверка и доступные сообщения об ошибках ----------
const successMessage = document.getElementById('success-message');
let successTimer;

// Сообщения на русском: стандартные тексты браузера зависят от языка системы.
function getErrorText(field) {
  const state = field.validity;

  if (state.valueMissing) {
    return field.type === 'checkbox' ? 'Необходимо согласие' : 'Заполните это поле';
  }
  if (state.typeMismatch) {
    return 'Введите корректный адрес, например example@mail.ru';
  }
  if (state.tooShort) {
    return 'Введите не меньше ' + field.minLength + ' символов';
  }
  if (state.patternMismatch) {
    return field.dataset.error || 'Проверьте формат';
  }
  return field.validationMessage;
}

// Для каждого поля создаём блок с текстом ошибки.
// Он связывается с полем через aria-describedby, чтобы диктор прочитал ошибку.
function getErrorBox(field) {
  const id = field.id + '-error';
  let box = document.getElementById(id);

  if (!box) {
    box = document.createElement('span');
    box.id = id;
    box.className = 'order-form__error';
    field.closest('.order-form__field').appendChild(box);
  }
  return box;
}

function validateField(field) {
  const box = getErrorBox(field);

  // Исходный aria-describedby (например, подсказка о формате) запоминаем один раз.
  if (field.dataset.baseDescribedby === undefined) {
    field.dataset.baseDescribedby = field.getAttribute('aria-describedby') || '';
  }
  const base = field.dataset.baseDescribedby;

  if (field.checkValidity()) {
    field.removeAttribute('aria-invalid');
    box.textContent = '';
    if (base) {
      field.setAttribute('aria-describedby', base);
    } else {
      field.removeAttribute('aria-describedby');
    }
    return true;
  }

  field.setAttribute('aria-invalid', 'true');
  box.textContent = getErrorText(field);
  field.setAttribute('aria-describedby', (base + ' ' + box.id).trim());
  return false;
}

function showSuccess() {
  if (!successMessage) return;

  successMessage.textContent = 'Форма успешно отправлена!';
  successMessage.hidden = false;

  clearTimeout(successTimer);
  successTimer = setTimeout(() => {
    successMessage.hidden = true;
  }, 6000);
}

document.querySelectorAll('form.order-form').forEach((form) => {
  // Подписка на ввод: когда пользователь исправляет поле, ошибка пропадает сразу.
  form.addEventListener('input', (event) => {
    if (event.target.getAttribute('aria-invalid') === 'true') {
      validateField(event.target);
    }
  });

  form.addEventListener('submit', (event) => {
    // Backend пока не подключён, поэтому стандартную отправку отменяем.
    event.preventDefault();

    // Проверяем только поля ввода (у кнопок тоже есть willValidate, но проверять их не нужно).
    const fields = Array.from(form.elements).filter(
      (element) => element.willValidate && element.closest('.order-form__field')
    );
    const invalidFields = fields.filter((field) => !validateField(field));

    if (invalidFields.length > 0) {
      // Фокус переходит на первое поле с ошибкой.
      invalidFields[0].focus();
      return;
    }

    showSuccess();
    form.reset();

    // Закрываем модальное окно, если форма находится в нём.
    if (orderDialog && orderDialog.contains(form)) {
      orderDialog.close();
    }
  });

  form.addEventListener('reset', () => {
    form.querySelectorAll('[aria-invalid]').forEach((field) => field.removeAttribute('aria-invalid'));
    form.querySelectorAll('.order-form__error').forEach((box) => {
      box.textContent = '';
    });
  });
});

// Выбрать дату связи в прошлом нельзя.
document.querySelectorAll('input[type="date"]').forEach((input) => {
  input.min = new Date().toLocaleDateString('sv'); // формат ГГГГ-ММ-ДД
});
