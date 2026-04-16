/* ═══════════════════════════════════════════════
   VOLO HOME — main.js (Uzbek version)
   ═══════════════════════════════════════════════ */

/* ── CONFIGURATION ── */
var BOT_TOKEN = '8637686529:AAE7tDyRx4wGyGijbpZhmizlXlv6wv2B2MI';
var CHAT_ID   = '-5225232338';
var WORKER_URL = 'https://volo-amocrm.volohomen1uz.workers.dev';
var META_PIXEL_ID = '2218810208922383';

/* ── Phone validation ── */
/* Минимум 9 цифр (917773609 = 9 цифр), максимум 13 цифр */
function validatePhone(phone) {
  var digits = phone.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 13;
}

/* ── Phone input: только цифры, +, (, ), -, пробел ── */
function restrictPhoneInput(input) {
  input.addEventListener('input', function() {
    /* Сохраняем только допустимые символы */
    var cleaned = this.value.replace(/[^\d+\-()\s]/g, '');
    if (this.value !== cleaned) {
      this.value = cleaned;
    }
  });

  input.addEventListener('keypress', function(e) {
    var allowed = /[\d+\-()\s]/;
    if (!allowed.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
      e.preventDefault();
    }
  });

  /* На мобильных — только числовая клавиатура */
  input.setAttribute('inputmode', 'tel');
  input.setAttribute('type', 'tel');
}

/* ── Send to Telegram ── */
function sendToTelegram(ism, telefon, model, manba) {
  var now = new Date();
  var dateStr = now.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  var message =
    '🛏 <b>Yangi ariza — VOLO HOME</b>\n\n' +
    '👤 <b>Ism:</b> ' + ism + '\n' +
    '📞 <b>Telefon:</b> ' + telefon + '\n' +
    '🛒 <b>Model:</b> ' + model + '\n' +
    '📍 <b>Manba:</b> ' + manba + '\n\n' +
    '🕐 <b>Vaqt:</b> ' + dateStr;

  return fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    })
  }).then(function(res) { return res.json(); });
}

/* ── Send to amoCRM (через Cloudflare Worker) ── */
function sendToAmoCRM(ism, telefon, model, manba) {
  return fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ism: ism, telefon: telefon, model: model, manba: manba })
  })
  .then(function(res) { return res.json(); })
  .catch(function(err) {
    console.error('amoCRM ошибка:', err);
    return { ok: false };
  });
}

/* ── Track Meta Pixel ── */
function trackMetaPixel(ism, telefon, model) {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'Lead', {
      content_name: model,
      content_type: 'product',
      currency: 'UZS',
      value: 0
    });
  }
}

/* ── Popup open/close ── */
function openPopup(type) {
  document.querySelectorAll('.popup-overlay').forEach(function(p) {
    p.classList.remove('active');
  });
  var el = document.getElementById('popup-' + type);
  if (el) {
    el.classList.add('active');
    var formWrap = el.querySelector('.popup-form-wrap');
    var success  = el.querySelector('.popup-success');
    if (formWrap) formWrap.style.display = 'block';
    if (success)  success.style.display  = 'none';
    el.querySelectorAll('input').forEach(function(inp) {
      inp.value = '';
      inp.style.borderColor = '#444';
    });
    /* Применяем ограничения к телефонным полям */
    el.querySelectorAll('.popup-input-phone, input[placeholder*="telefon"], input[placeholder*="raqam"]').forEach(function(inp) {
      restrictPhoneInput(inp);
    });
    var btn = el.querySelector('.btn-popup-submit');
    if (btn) {
      btn.textContent = 'Buyurtma berish \u2192';
      btn.disabled = false;
      btn.style.background = '';
    }
  }
  /* iOS/Android fix — сохраняем позицию скролла */
  var scrollY = window.scrollY;
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = '-' + scrollY + 'px';
  document.body.style.width = '100%';
  document.body.dataset.scrollY = scrollY;
}

function closePopup(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('active');
  /* Восстанавливаем позицию скролла */
  var scrollY = parseInt(document.body.dataset.scrollY || '0');
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, scrollY);
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    var active = document.querySelector('.popup-overlay.active');
    if (active) closePopup(active.id);
  }
});

/* ── Show phone error ── */
function showPhoneError(input) {
  input.style.borderColor = '#E87722';
  input.placeholder = 'Kamida 9 ta raqam kiriting!';
  setTimeout(function() {
    input.style.borderColor = '#444';
    input.placeholder = 'Telefon raqamingiz';
  }, 2500);
}

/* ── Submit from product popup ── */
function submitPopupForm(popupId, modelName) {
  var popup    = document.getElementById('popup-' + popupId);
  var nameInp  = popup.querySelector('.popup-input-name');
  var phoneInp = popup.querySelector('.popup-input-phone');
  var btn      = popup.querySelector('.btn-popup-submit');

  var name  = nameInp.value.trim();
  var phone = phoneInp.value.trim();

  var ok = true;

  if (!name) {
    nameInp.style.borderColor = '#E87722';
    ok = false;
    setTimeout(function() { nameInp.style.borderColor = '#444'; }, 2500);
  }

  if (!phone || !validatePhone(phone)) {
    showPhoneError(phoneInp);
    ok = false;
  }

  if (!ok) return;

  btn.textContent = '\u23F3 Yuborilmoqda...';
  btn.disabled = true;

  var source = 'Popup — ' + modelName;

  Promise.all([
    sendToTelegram(name, phone, modelName, source),
    sendToAmoCRM(name, phone, modelName, source)
  ])
  .then(function(results) {
    trackMetaPixel(name, phone, modelName);
    if (results[0].ok || results[1].ok) {
      popup.querySelector('.popup-form-wrap').style.display = 'none';
      var successMsg = popup.querySelector('.popup-success');
      if (!successMsg) {
        successMsg = document.createElement('div');
        successMsg.className = 'popup-success';
        successMsg.innerHTML = '<p style="text-align: center; color: #2a9d2a; font-size: 16px; font-weight: bold;">✓ Ariza yuborildi!<br><span style="font-size: 13px; color: var(--muted);">Biz tez orada bog\'lanamiz</span></p>';
        popup.querySelector('.popup-box').appendChild(successMsg);
      }
      successMsg.style.display = 'block';
      setTimeout(function() { closePopup('popup-' + popupId); }, 3000);
    } else {
      btn.textContent = '\u274C Xatolik';
      btn.style.background = '#cc0000';
      btn.disabled = false;
      setTimeout(function() {
        btn.textContent = 'Buyurtma berish \u2192';
        btn.style.background = '';
      }, 3000);
    }
  })
  .catch(function() {
    btn.textContent = '\u274C Xatolik';
    btn.style.background = '#cc0000';
    btn.disabled = false;
    setTimeout(function() {
      btn.textContent = 'Buyurtma berish \u2192';
      btn.style.background = '';
    }, 3000);
  });
}

/* ── Consult popup (hero button) ── */
function submitConsult() {
  var nameEl     = document.getElementById('consult-name');
  var phoneEl    = document.getElementById('consult-phone');
  var interestEl = document.getElementById('consult-interest');

  var name     = nameEl ? nameEl.value.trim() : '';
  var phone    = phoneEl ? phoneEl.value.trim() : '';
  var interest = interestEl ? (interestEl.value || '\u2014') : '\u2014';

  var ok = true;

  if (!name) {
    if (nameEl) {
      nameEl.style.borderColor = '#E87722';
      setTimeout(function() { nameEl.style.borderColor = ''; }, 2500);
    }
    ok = false;
  }

  if (!phone || !validatePhone(phone)) {
    if (phoneEl) showPhoneError(phoneEl);
    ok = false;
  }

  if (!ok) return;

 var btn = document.querySelector('#popup-consult .btn-popup-submit');
if (!btn) return;
  btn.textContent = '\u23F3 Yuborilmoqda...';
  btn.disabled = true;

  var source = 'Konsultatsiya popup';

  Promise.all([
    sendToTelegram(name, phone, interest, source),
    sendToAmoCRM(name, phone, interest, source)
  ])
  .then(function(results) {
    trackMetaPixel(name, phone, interest);
    if (results[0].ok || results[1].ok) {
      var formWrap = document.getElementById('consult-form-wrap');
      var successEl = document.getElementById('consult-success');
      if (formWrap) formWrap.style.display = 'none';
      if (successEl) successEl.style.display = 'block';
      setTimeout(function() {
        closePopup('popup-consult');
        setTimeout(function() {
          if (formWrap) formWrap.style.display = 'block';
          if (successEl) successEl.style.display = 'none';
          if (nameEl) nameEl.value = '';
          if (phoneEl) phoneEl.value = '';
          if (interestEl) interestEl.value = '';
          btn.textContent = "Ma'lumotlarni yuborish \u2192";
          btn.disabled = false;
        }, 400);
      }, 3000);
    } else {
      alert("Xatolik yuz berdi, qayta urinib ko'ring.");
      btn.textContent = "Ma'lumotlarni yuborish \u2192";
      btn.disabled = false;
    }
  })
  .catch(function() {
    alert("Xatolik yuz berdi, qayta urinib ko'ring.");
    btn.textContent = "Ma'lumotlarni yuborish \u2192";
    btn.disabled = false;
  });
}

/* ── Smooth scroll ── */
function scrollTo(selector) {
  var el = document.querySelector(selector);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
    var menu = document.getElementById('mobile-menu');
    var burger = document.getElementById('nav-burger');
    if (menu && menu.classList.contains('open')) {
      menu.classList.remove('open');
      burger.classList.remove('open');
      document.body.style.overflow = '';
    }
  }
}

/* ── Mobile Scroll Dots ── */
function initScrollDots(gridId, dotsId) {
  var grid = document.getElementById(gridId);
  var dotsContainer = document.getElementById(dotsId);
  if (!grid || !dotsContainer) return;

  function isMobile() { return window.innerWidth <= 768; }

  function buildDots() {
    dotsContainer.innerHTML = '';
    if (!isMobile()) return;
    var cards = grid.querySelectorAll('.card');
    if (!cards.length) return;
    cards.forEach(function(_, i) {
      var dot = document.createElement('button');
      dot.className = 'scroll-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Karta ' + (i + 1));
      dot.addEventListener('click', function() {
        grid.scrollTo({ left: cards[i].offsetLeft - 20, behavior: 'smooth' });
      });
      dotsContainer.appendChild(dot);
    });
  }

  function updateActiveDot() {
    if (!isMobile()) return;
    var cards = grid.querySelectorAll('.card');
    var dots  = dotsContainer.querySelectorAll('.scroll-dot');
    var activeIdx = 0, minDist = Infinity;
    cards.forEach(function(card, i) {
      var dist = Math.abs(card.offsetLeft - 20 - grid.scrollLeft);
      if (dist < minDist) { minDist = dist; activeIdx = i; }
    });
    dots.forEach(function(dot, i) { dot.classList.toggle('active', i === activeIdx); });
  }

  buildDots();
  grid.addEventListener('scroll', updateActiveDot, { passive: true });
  window.addEventListener('resize', function() { buildDots(); updateActiveDot(); });
}

/* ── Mobile Scroll Arrows ── */
function initScrollArrows(gridId) {
  var grid = document.getElementById(gridId);
  if (!grid) return;
  var wrapper  = grid.parentElement;
  var leftBtn  = wrapper.querySelector('.scroll-arrow-left');
  var rightBtn = wrapper.querySelector('.scroll-arrow-right');
  if (!leftBtn || !rightBtn) return;

  function isMobile() { return window.innerWidth <= 768; }
  function getScrollStep() {
    var card = grid.querySelector('.card');
    return card ? card.offsetWidth + 14 : 260;
  }
  function updateArrows() {
    if (!isMobile()) {
      leftBtn.classList.add('hidden');
      rightBtn.classList.add('hidden');
      return;
    }
    var maxScroll = grid.scrollWidth - grid.clientWidth;
    leftBtn.classList.toggle('hidden',  grid.scrollLeft <= 4);
    rightBtn.classList.toggle('hidden', grid.scrollLeft >= maxScroll - 4);
  }

  leftBtn.addEventListener('click',  function() { grid.scrollBy({ left: -getScrollStep(), behavior: 'smooth' }); });
  rightBtn.addEventListener('click', function() { grid.scrollBy({ left:  getScrollStep(), behavior: 'smooth' }); });
  grid.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  updateArrows();
}

/* ── DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', function() {

  /* Mobile burger menu */
  var burger = document.getElementById('nav-burger');
  var menu   = document.getElementById('mobile-menu');
  if (burger && menu) {
    burger.addEventListener('click', function() {
      var isOpen = menu.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    menu.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        menu.classList.remove('open');
        burger.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Применяем ограничения к телефонным полям ── */
  /* Консультация popup */
  var consultPhone = document.getElementById('consult-phone');
  if (consultPhone) restrictPhoneInput(consultPhone);

  /* Нижняя форма */
  var bottomPhoneField = document.querySelector('#form .field input[type="tel"], #form .field input[placeholder*="Telefon"]');
  if (bottomPhoneField) restrictPhoneInput(bottomPhoneField);

  /* ── Кнопка Konsultatsiya в hero (мобильный фикс) ── */
  document.querySelectorAll('[onclick*="openPopup(\'consult\')"], .btn-primary, .nav-cta').forEach(function(btn) {
    if (btn.getAttribute('onclick') && btn.getAttribute('onclick').indexOf('consult') !== -1) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        openPopup('consult');
      });
    }
  });

  /* Scroll reveal */
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(function(el) {
    observer.observe(el);
  });

  /* Nav scroll shadow */
  var nav = document.querySelector('nav');
  window.addEventListener('scroll', function() {
    nav.style.boxShadow = window.scrollY > 60 ? '0 4px 24px rgba(0,0,0,0.5)' : 'none';
  }, { passive: true });

  /* Init scroll dots & arrows */
  initScrollDots('mattress-grid', 'mattress-dots');
  initScrollDots('beds-grid', 'beds-dots');
  initScrollArrows('mattress-grid');
  initScrollArrows('beds-grid');

  /* ── Bottom form submit ── */
  var submitBtn = document.querySelector('.btn-submit');
  if (submitBtn) {
    submitBtn.addEventListener('click', function() {
      var fields = document.querySelectorAll('#form .field input, #form .field select');
      var ok = true;

      fields.forEach(function(inp, index) {
        if (!inp.value) {
          inp.style.borderColor = '#E87722';
          ok = false;
          setTimeout(function() { inp.style.borderColor = ''; }, 2500);
        }
        /* Второе поле — телефон */
        if (index === 1 && inp.value && !validatePhone(inp.value)) {
          inp.style.borderColor = '#E87722';
          var origPlaceholder = inp.placeholder;
          inp.placeholder = 'Kamida 9 ta raqam!';
          ok = false;
          setTimeout(function() {
            inp.style.borderColor = '';
            inp.placeholder = origPlaceholder;
          }, 2500);
        }
      });

      if (!ok) return;

      var ism      = fields[0].value;
      var telefon  = fields[1].value;
      var mahsulot = fields[2].value;
      var kimUchun = fields[3].value;
      var narx     = fields[4].value;

      var now = new Date();
      var dateStr = now.toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      var message =
        '\uD83D\uDECF <b>Yangi ariza — VOLO HOME</b>\n\n' +
        '\uD83D\uDC64 <b>Ism:</b> ' + ism + '\n' +
        '\uD83D\uDCDE <b>Telefon:</b> ' + telefon + '\n' +
        '\uD83D\uDED2 <b>Mahsulot:</b> ' + mahsulot + '\n' +
        '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67 <b>Kim uchun:</b> ' + kimUchun + '\n' +
        '\uD83D\uDCB0 <b>Narx oralig\'i:</b> ' + narx + '\n' +
        '\uD83D\uDCCD <b>Manba:</b> Pastki forma\n\n' +
        '\uD83D\uDD50 <b>Vaqt:</b> ' + dateStr;

      submitBtn.textContent = '\u23F3 Yuborilmoqda...';
      submitBtn.disabled = true;

      var source = 'Pastki forma';

      Promise.all([
        fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'HTML' })
        }).then(function(r) { return r.json(); }),
        sendToAmoCRM(ism, telefon, mahsulot, source)
      ])
      .then(function(results) {
        trackMetaPixel(ism, telefon, mahsulot);
        if (results[0].ok || results[1].ok) {
          submitBtn.textContent = '\u2713 Ariza yuborildi!';
          submitBtn.style.background = '#2a9d2a';
          fields.forEach(function(f) { f.value = ''; });
        } else {
          submitBtn.textContent = '\u274C Xatolik yuz berdi';
          submitBtn.style.background = '#cc0000';
        }
      })
      .catch(function() {
        submitBtn.textContent = '\u274C Xatolik yuz berdi';
        submitBtn.style.background = '#cc0000';
      })
      .finally(function() {
        submitBtn.disabled = false;
        setTimeout(function() {
          submitBtn.textContent = "Ma'lumotlarni yuborish \u2192";
          submitBtn.style.background = '';
        }, 3000);
      });
    });
  }

});
