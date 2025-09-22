export function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(`${remainingSeconds}s`);
  }

  return parts.join(" ");
}

export function formatBytes(bytes) {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

export function formatDecimalCurrency(amount, prefix = "$", suffix = "", prefixSpaceAfter = false, suffixSpaceBefore = true) {
  const formattedAmount = amount.toFixed(2);
  const prefixStr = prefix ? `${prefix}${prefixSpaceAfter ? ' ' : ''}` : '';
  const suffixStr = suffix ? `${suffixSpaceBefore ? ' ' : ''}${suffix}` : '';
  return `${prefixStr}${formattedAmount}${suffixStr}`;
}