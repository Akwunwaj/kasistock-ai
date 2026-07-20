export async function fetchStandaloneHtml(baseUrl, path) {
  const response = await fetch(new URL(path, baseUrl));
  if (!response.ok) throw new Error(`Failed to fetch ${path}: HTTP ${response.status}`);
  let html = await response.text();

  const stylesheetMatches = [
    ...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*>/gi),
  ];
  const styles = [];
  for (const match of stylesheetMatches) {
    const cssResponse = await fetch(new URL(match[1], baseUrl));
    if (!cssResponse.ok) throw new Error(`Failed to fetch stylesheet ${match[1]}.`);
    styles.push(await cssResponse.text());
  }

  html = html
    .replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, "")
    .replace(/<link[^>]+rel=["']preload["'][^>]*>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<link[^>]+as=["']script["'][^>]*>/gi, "")
    .replace("</head>", `<style>${styles.join("\n")}</style></head>`);

  return html;
}
