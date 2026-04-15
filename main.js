/* ═══════════════════════════════════════════════
   VOLO HOME — main.js (Uzbek version)
   ═══════════════════════════════════════════════ */

/* ── CONFIGURATION ── */
var BOT_TOKEN = '8637686529:AAE7tDyRx4wGyGijbpZhmizlXlv6wv2B2MI';
var CHAT_ID   = '-5225232338';
var AMOCRM_DOMAIN = 'your-domain.amocrm.ru';  // Клиент вставляет свой домен (например: volo.amocrm.ru)
var AMOCRM_TOKEN = 'your-api-token';           // Клиент вставляет свой API токен
var META_PIXEL_ID = 'your-pixel-id';           // Клиент вставляет свой Meta Pixel ID

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

/* ── Send to amoCRM ── */
function sendToAmoCRM(ism, telefon, model, manba) {
  if (!AMOCRM_DOMAIN || AMOCRM_DOMAIN === 'your-domain.amocrm.ru' ||
      !AMOCRM_TOKEN || AMOCRM_TOKEN === 'your-api-token') {
    console.warn('amoCRM не настроен. Пропускаем отправку.');
    return Promise.resolve({ ok: true });
  }

  var amoUrl = 'https://' + AMOCRM_DOMAIN + '/api/v4/contacts';
  var contactData = {
    name: ism,
    custom_fields_values: [
      { field_id: 1270170, values: [{ value: telefon }] },
      { field_id: 1270171, values: [{ value: model }] },
      { field_id: 1270172, values: [{ value: manba }] }
    ]
  };

  return fetch(amoUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + AMOCRM_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(contactData)
  })
  .then(function(res) { return res.json(); })
  .catch(function(err) {
    console.error('amoCRM ошибка:', err);
    return { ok: false };
  });
}

/* ── Track Meta Pixel ── */
function trackMetaPixel(ism, telefon, model) {
  if (!META_PIXEL_ID || META_PIXEL_ID === 'your-pixel-id') {
    console.warn('Meta Pixel не настроен. Пропускаем отправку.');
    return;
  }

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
    // Reset form state on open
    var formWrap = el.querySelector('.popup-form-wrap');
    var success  = el.querySelector('.popup-success');
    if (formWrap) formWrap.style.display = 'block';
    if (success)  success.style.display  = 'none';
    el.querySelectorAll('input').forEach(function(inp) {
      inp.value = '';
      inp.style.borderColor = '#444';
    });
    var btn = el.querySelector('.btn-popup-submit');
    if (btn) {
      btn.textContent = 'Buyurtma berish \u2192';
      btn.disabled = false;
      btn.style.background = '';
    }
  }
  document.body.style.overflow = 'hidden';
}

function closePopup(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('active');
  document.body.style.overflow = '';
}

function closePopupOutside(e, id) {
  if (e.target === document.getElementById(id)) closePopup(id);
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.popup-overlay.active').forEach(function(p) {
      p.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
});

/* ── Submit from product popup (mattress / bed) ── */
submitPopupForm/* ── Submit from product popup (mattress / bed) ── */
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
    setTimeout(function() { nameInp.style.borderColor = '#444'; }, 2000);
  }
  if (!phone) {
    phoneInp.style.borderColor = '#E87722';
    ok = false;
    setTimeout(function() { phoneInp.style.borderColor = '#444'; }, 2000);
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
      // Показываем сообщение об успехе
      popup.querySelector('.popup-form-wrap').style.display = 'none';
      var successMsg = popup.querySelector('.popup-success');
      if (!successMsg) {
        // Если элемента нет, создаём его
        successMsg = document.createElement('div');
        successMsg.className = 'popup-success';
        successMsg.innerHTML = '<p style="text-align: center; color: #2a9d2a; font-size: 16px; font-weight: bold;">✓ Ariza yuborildi!<br><span style="font-size: 13px; color: var(--muted);">Biz tez orada bog\'lanamiz</span></p>';
        popup.querySelector('.popup-box').appendChild(successMsg);
      }
      successMsg.style.display = 'block';

      // Закрываем попап через 3 секунды
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
  var name     = document.getElementById('consult-name').value.trim();
  var phone    = document.getElementById('consult-phone').value.trim();
  var interest = document.getElementById('consult-interest').value || '\u2014';

  if (!name || !phone) {
    alert('Iltimos, ism va telefon raqamni kiriting.');
    return;
  }

  var btn = document.querySelector('#popup-consult .btn-popup');
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
      document.getElementById('consult-form-wrap').style.display = 'none';
      document.getElementById('consult-success').style.display = 'block';
      setTimeout(function() {
        closePopup('popup-consult');
        setTimeout(function() {
          document.getElementById('consult-form-wrap').style.display = 'block';
          document.getElementById('consult-success').style.display = 'none';
          document.getElementById('consult-name').value = '';
          document.getElementById('consult-phone').value = '';
          document.getElementById('consult-interest').value = '';
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
/* ── Popup open/close ── */
function openPopup(type) {
  document.querySelectorAll('.popup-overlay').forEach(function(p) {
    p.classList.remove('active');
  });
  var el = document.getElementById('popup-' + type);
  if (el) {
    el.classList.add('active');
    // Reset form state on open
    var formWrap = el.querySelector('.popup-form-wrap');
    var success  = el.querySelector('.popup-success');
    if (formWrap) formWrap.style.display = 'block';
    if (success)  success.style.display  = 'none';
    el.querySelectorAll('input').forEach(function(inp) {
      inp.value = '';
      inp.style.borderColor = '#444';
    });
    var btn = el.querySelector('.btn-popup-submit');
    if (btn) {
      btn.textContent = 'Buyurtma berish \u2192';
      btn.disabled = false;
      btn.style.background = '';
    }
  }
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = '17px'; // ← ДОБАВИТЬ ЭТУ СТРОКУ
}

function closePopup(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('active');
  document.body.style.overflow = '';
  document.body.style.paddingRight = ''; // ← ДОБАВИТЬ ЭТУ СТРОКУ
}
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
      fields.forEach(function(inp) {
        if (!inp.value) {
          inp.style.borderColor = '#E87722';
          ok = false;
          setTimeout(function() { inp.style.borderColor = ''; }, 2000);
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
