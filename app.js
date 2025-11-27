/* app.js — DreamStream v2 FULL FINAL (Indonesian) */

/*
  Fitur utama:
  - leaderboard per wallet (akumulatif)
  - claim score dari iframe -> simpan ke leaderboard
  - swap score -> panggil DreamWeb3.swapScore, kurangi score lokal
  - refresh UI balances & pairs jika wallet terhubung
  - logging activity
*/

(function () {
  // ---------- helper DOM ----------
  const $ = (id) => document.getElementById(id);

  function addActivity(msg) {
    const el = $('activity');
    if (!el) return;
    const now = new Date().toLocaleTimeString();
    el.innerHTML += `<div>[${now}] ${msg}</div>`;
    el.scrollTop = el.scrollHeight;
  }

  // ---------- current user (diisi saat connect) ----------
  window.currentUser = null;

  // dipanggil oleh web3.js (setelah connect) — jika web3.js memanggil afterWalletConnected, kita juga gunakan
  window.afterWalletConnected = function () {
    // set currentUser dari DreamWeb3 jika tersedia
    if (window.DreamWeb3 && window.DreamWeb3.address) {
      window.currentUser = String(window.DreamWeb3.address).toLowerCase();
    } else if ($('addr-display')) {
      window.currentUser = String($('addr-display').innerText || '').toLowerCase();
    }
    addActivity('[system] Wallet connected: ' + (window.currentUser || 'unknown'));
    refreshLeaderboardUI();
    // aktifkan mock stream jika toggle aktif (web3.js biasanya sudah memicu startMockStream)
    if (typeof startMockStream === 'function' && $('toggle-sim') && $('toggle-sim').checked) startMockStream();
  };

  // ---------- Leaderboard storage helpers ----------
  function loadLeaderboard() {
    try {
      return JSON.parse(localStorage.getItem('leaderboard') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveLeaderboard(lb) {
    localStorage.setItem('leaderboard', JSON.stringify(lb));
  }

  function addPointsToWallet(wallet, pts) {
    if (!wallet) return;
    const w = wallet.toLowerCase();
    let lb = loadLeaderboard();
    const idx = lb.findIndex(x => x.wallet === w);
    if (idx >= 0) {
      lb[idx].score = (lb[idx].score || 0) + Number(pts || 0);
    } else {
      lb.push({ wallet: w, score: Number(pts || 0) });
    }
    lb.sort((a, b) => (b.score || 0) - (a.score || 0));
    saveLeaderboard(lb);
    refreshLeaderboardUI();
  }

  function deductPointsFromWallet(wallet, pts) {
    if (!wallet) return false;
    const w = wallet.toLowerCase();
    let lb = loadLeaderboard();
    const idx = lb.findIndex(x => x.wallet === w);
    if (idx < 0) return false;
    const current = Number(lb[idx].score || 0);
    if (current < pts) return false;
    lb[idx].score = current - pts;
    // jika jadi nol kita biarkan tetap ada (aku minta simpan sebagai record)
    lb.sort((a, b) => (b.score || 0) - (a.score || 0));
    saveLeaderboard(lb);
    refreshLeaderboardUI();
    return true;
  }

  // ---------- UI render ----------
  window.refreshLeaderboardUI = function () {
    const lb = loadLeaderboard();
    const ul = $('leaderboard-list');
    if (ul) {
      ul.innerHTML = '';
      lb.slice(0, 10).forEach((it, i) => {
        const walletShort = (it.wallet || '').slice(0, 6) + '...' + (it.wallet || '').slice(-4);
        const li = document.createElement('li');
        li.innerText = `${i + 1}. ${walletShort} — ${it.score || 0}`;
        ul.appendChild(li);
      });
    }

    // update my total score
    const my = (window.currentUser || '').toLowerCase();
    const myEntry = lb.find(x => x.wallet === my);
    $('my-total-score') && ($('my-total-score').innerText = myEntry ? String(myEntry.score || 0) : '0');

    // update global points display (dashboard)
    const totalPoints = lb.reduce((s, x) => s + (x.score || 0), 0);
    $('points') && ($('points').innerText = String(totalPoints));
  };

  // initial render
  refreshLeaderboardUI();

  // ---------- Swap button handler (UI) ----------
  const btnSwap = $('btn-swap');
  if (btnSwap) {
    btnSwap.addEventListener('click', async () => {
      const val = Number(($('swap-input').value || 0));
      if (!window.currentUser) {
        alert('Silakan hubungkan wallet terlebih dahulu.');
        return;
      }
      if (isNaN(val) || val < 10 || val % 10 !== 0) {
        $('swap-status') && ($('swap-status').innerText = 'Minimal 10 poin dan harus kelipatan 10.');
        return;
      }

      // cek saldo user
      const lb = loadLeaderboard();
      const me = lb.find(x => x.wallet === window.currentUser);
      const myScore = me ? Number(me.score || 0) : 0;
      if (myScore < val) {
        $('swap-status') && ($('swap-status').innerText = 'Skor tidak mencukupi untuk swap.');
        return;
      }

      // Panggil DreamWeb3.swapScore (bisa mengembalikan string/tx object tergantung implementasi)
      try {
        $('swap-status') && ($('swap-status').innerText = 'Memproses swap...');
        let res;
        if (window.DreamWeb3 && typeof window.DreamWeb3.swapScore === 'function') {
          res = await window.DreamWeb3.swapScore(val); // dapat berupa string atau objek tx
        } else {
          // fallback lokal: simulasi
          res = `Simulasi: Anda menerima ${Math.floor(val / 10)} PAC`;
        }

        // jika sukses (anggap tidak null)
        if (res === null || typeof res === 'undefined') {
          $('swap-status') && ($('swap-status').innerText = 'Swap gagal.');
          addActivity('[swap] Swap gagal atau dibatalkan.');
          return;
        }

        // kurangi poin lokal
        const ok = deductPointsFromWallet(window.currentUser, val);
        if (!ok) {
          $('swap-status') && ($('swap-status').innerText = 'Gagal mengurangi skor lokal.');
          return;
        }

        // update balances (jika DreamWeb3 menyediakan)
        if (window.DreamWeb3 && typeof window.DreamWeb3.refreshBalances === 'function') {
          try { await window.DreamWeb3.refreshBalances(); } catch(e){/* ignore */ }
        }

        $('swap-status') && ($('swap-status').innerText = (typeof res === 'string' ? res : 'Swap berhasil (onchain).'));
        addActivity(`[swap] ${window.currentUser} swapped ${val} -> ${Math.floor(val/10)} PAC`);

      } catch (err) {
        console.error('Swap error', err);
        $('swap-status') && ($('swap-status').innerText = 'Swap error: ' + (err.message || err));
        addActivity('[swap] error: ' + (err.message || err));
      }
    });
  }

  // ---------- Export / Clear handlers ----------
  $('btn-clear') && $('btn-clear').addEventListener('click', () => {
    $('activity') && ($('activity').innerHTML = '');
    addActivity('[system] Activity cleared');
  });

  $('btn-export') && $('btn-export').addEventListener('click', () => {
    const txt = ($('activity') && $('activity').innerText) || '';
    const blob = new Blob([txt], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dreamstream-activity.txt';
    a.click();
  });

  // ---------- IFRAME ↔ PARENT messages ----------
  window.addEventListener('message', async (ev) => {
    const data = ev.data || {};
    if (!data.type) return;

    // iframe requests start game (parent will call DreamWeb3.startGame -> onchain fee)
    if (data.type === 'REQUEST_START_GAME') {
      addActivity('[iframe] REQUEST_START_GAME received');
      if (!window.DreamWeb3 || typeof window.DreamWeb3.startGame !== 'function') {
        addActivity('[onchain] startGame not available');
        // reply failure
        ev.source && ev.source.postMessage({ type: 'START_GAME_RESULT', success: false }, '*');
        return;
      }

      const ok = await window.DreamWeb3.startGame();
      addActivity('[onchain] startGame result: ' + (ok ? 'success' : 'failed'));
      // reply to iframe
      ev.source && ev.source.postMessage({ type: 'START_GAME_RESULT', success: !!ok }, '*');
      // if success, ensure currentUser is set and refresh balances
      if (ok) {
        if (window.DreamWeb3 && window.DreamWeb3.address) {
          window.currentUser = String(window.DreamWeb3.address).toLowerCase();
        }
        try { window.DreamWeb3.refreshBalances && await window.DreamWeb3.refreshBalances(); } catch(e) {}
      }
    }

    // iframe requests to claim score -> add to leaderboard (no swap)
    if (data.type === 'REQUEST_CLAIM_SCORE') {
      const pts = Number(data.points || 0);
      addActivity(`[iframe] REQUEST_CLAIM_SCORE ${pts}`);
      // ensure user known
      let user = (window.currentUser || '').toLowerCase();
      if (!user && window.DreamWeb3 && window.DreamWeb3.address) user = String(window.DreamWeb3.address).toLowerCase();
      if (!user) {
        // reply fail
        ev.source && ev.source.postMessage({ type: 'CLAIM_RESULT', result: { success: false, reason: 'wallet_not_connected' } }, '*');
        addActivity('[claim] Failed - wallet not connected');
        return;
      }

      // add to leaderboard (local)
      addPointsToWallet(user, pts);
      addActivity(`[claim] ${user} +${pts} points saved to leaderboard`);

      // reply success to iframe
      ev.source && ev.source.postMessage({ type: 'CLAIM_RESULT', result: { success: true, points: pts } }, '*');

      // also refresh balances/UI
      refreshLeaderboardUI();
      try { window.DreamWeb3.refreshBalances && window.DreamWeb3.refreshBalances(); } catch(e){}

      return;
    }
  });

  // ---------- helper to ensure leaderboard shows wallet as soon as connect happens ----------
  // Watch DOM addr-display if present and set currentUser automatically (for UIs that update addr-display)
  function pollAddrDisplay() {
    const el = $('addr-display');
    if (!el) return;
    let last = '';
    setInterval(() => {
      if (el.innerText && el.innerText !== last) {
        last = el.innerText;
        // try to normalize address
        const txt = String(last).trim();
        if (txt.startsWith('0x') && txt.length > 30) {
          window.currentUser = txt.toLowerCase();
          addActivity('[system] detected wallet address in UI: ' + window.currentUser);
          refreshLeaderboardUI();
        }
      }
    }, 700);
  }
  pollAddrDisplay();

  // expose small API for other scripts
  window.DreamApp = {
    addActivity,
    refreshLeaderboardUI,
    addPointsToWallet,
    deductPointsFromWallet
  };

})();
