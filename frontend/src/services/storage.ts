const SALT_KEY = "mshield_salt";
const ACTION_KEY = "mshield_action";

export function saveSaltData(action: string, salt: string) {
  localStorage.setItem(SALT_KEY, salt);
  localStorage.setItem(ACTION_KEY, action);
}

export function getStoredSalt(): string | null {
  return localStorage.getItem(SALT_KEY);
}

export function getStoredAction(): string | null {
  return localStorage.getItem(ACTION_KEY);
}

export function clearSaltData() {
  localStorage.removeItem(SALT_KEY);
  localStorage.removeItem(ACTION_KEY);
}
