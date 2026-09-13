import { notificationsRegistry, currentUser, setNotificationsRegistry } from './state.js';

export function pushNotification(targetRecipient, title, message, targetAction = 'general') {
  const newNotif = {
    id: "NOTIF-" + Date.now(),
    recipient: targetRecipient,
    title: title,
    message: message,
    action: targetAction,
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    date: new Date().toLocaleDateString('en-IN'),
    isRead: false
  };

  notificationsRegistry.unshift(newNotif);
  localStorage.setItem('pgf_notifications', JSON.stringify(notificationsRegistry));
  renderNotificationBadge();
}

export function markAllNotificationsAsRead() {
  const currentRecipient = currentUser ? (currentUser.isAdmin ? 'ADMIN' : currentUser.email) : null;
  if (!currentRecipient) return;

  let changed = false;
  notificationsRegistry.forEach(n => {
    if ((n.recipient === currentRecipient || (currentUser.isAdmin && n.recipient === 'ADMIN')) && !n.isRead) {
      n.isRead = true;
      changed = true;
    }
  });

  if (changed) {
    localStorage.setItem('pgf_notifications', JSON.stringify(notificationsRegistry));
    renderNotificationBadge();
  }
}

export function handleNotificationClick(notifId) {
  const notif = notificationsRegistry.find(n => n.id === notifId);
  if (!notif) return;

  notif.isRead = true;
  localStorage.setItem('pgf_notifications', JSON.stringify(notificationsRegistry));
  renderNotificationBadge();

  const panel = document.getElementById("notificationDropdownPanel");
  if (panel) panel.style.display = "none";

  if (currentUser && currentUser.isAdmin) {
    if (notif.action === 'order' && typeof window.switchErpTab === 'function') window.switchErpTab('erpOrdersTab', 'tabNavOrders');
    else if ((notif.action === 'booking' || notif.action === 'certificate') && typeof window.switchErpTab === 'function') window.switchErpTab('erpBookingsTab', 'tabNavBookings');
    else if (typeof window.switchErpTab === 'function') window.switchErpTab('erpOrdersTab', 'tabNavOrders');
  } else {
    if (notif.action === 'certificate' || notif.action === 'booking') {
      if (typeof window.openBookingsModal === 'function') window.openBookingsModal();
    } else {
      if (typeof window.openOrdersModal === 'function') window.openOrdersModal();
    }
  }
}

export function renderNotificationBadge() {
  const badge = document.getElementById("notificationCountBadge");
  const listBody = document.getElementById("notificationListBody");
  if (!badge || !listBody) return;

  if (!currentUser) {
    badge.style.display = "none";
    listBody.innerHTML = `<span class="muted" style="font-size:12px; text-align:center; padding:10px;">Please login to view notifications.</span>`;
    return;
  }

  const myNotifs = notificationsRegistry.filter(n => {
    if (currentUser.isAdmin) {
      return n.recipient === 'ADMIN';
    } else {
      return n.recipient === currentUser.email || 
             n.recipient === currentUser.phone || 
             n.recipient === 'GENERAL' || 
             n.recipient === 'all';
    }
  });

  const unreadCount = myNotifs.filter(n => !n.isRead).length;

  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.style.display = "inline-block";
  } else {
    badge.style.display = "none";
  }

  if (myNotifs.length === 0) {
    listBody.innerHTML = `<span class="muted" style="font-size:12px; text-align:center; padding:10px;">No new alerts.</span>`;
  } else {
    listBody.innerHTML = myNotifs.map(n => `
      <div class="notif-interactive-card" onclick="handleNotificationClick('${n.id}')" style="background:${n.isRead ? '#f8fafc' : '#eff6ff'}; border:1px solid ${n.isRead ? '#e2e8f0' : '#bfdbfe'}; border-radius:8px; padding:10px; font-size:12px; margin-bottom:6px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
          <strong style="color:${n.isRead ? '#334155' : '#1d4ed8'};">${n.title}</strong>
          <span style="font-size:10px; color:#64748b;">${n.time}</span>
        </div>
        <div style="color:#475569; line-height:1.3;">${n.message}</div>
      </div>
    `).join("");
  }
}

export function toggleNotificationDropdown() {
  const panel = document.getElementById("notificationDropdownPanel");
  if (!panel) return;
  if (panel.style.display === "none" || panel.style.display === "") {
    panel.style.display = "block";
    renderNotificationBadge();
    markAllNotificationsAsRead();
  } else {
    panel.style.display = "none";
  }
}

export function clearAllNotifications() {
  const currentRecipient = currentUser ? (currentUser.isAdmin ? 'ADMIN' : currentUser.email) : null;
  if (!currentRecipient) return;

  const updatedNotifs = notificationsRegistry.filter(n => n.recipient !== currentRecipient && !(currentUser.isAdmin && n.recipient === 'ADMIN'));
  setNotificationsRegistry(updatedNotifs);
  localStorage.setItem('pgf_notifications', JSON.stringify(notificationsRegistry));
  renderNotificationBadge();
}

document.addEventListener('click', function(e) {
  const wrapper = document.getElementById("notificationBellWrapper");
  const panel = document.getElementById("notificationDropdownPanel");
  if (wrapper && panel && !wrapper.contains(e.target)) {
    if (panel.style.display === "block") {
      markAllNotificationsAsRead();
    }
    panel.style.display = "none";
  }
});