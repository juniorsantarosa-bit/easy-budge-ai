import html2canvas from "html2canvas";

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));

  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }

          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

export async function captureElement(node: HTMLElement) {
  try {
    await document.fonts.ready;
  } catch {
    // ignore font readiness failures
  }

  const width = Math.ceil(node.getBoundingClientRect().width);
  const sandbox = document.createElement("div");
  sandbox.style.position = "fixed";
  sandbox.style.left = "-100000px";
  sandbox.style.top = "0";
  sandbox.style.zIndex = "-1";
  sandbox.style.pointerEvents = "none";
  sandbox.style.background = "#ffffff";
  sandbox.style.padding = "0";
  sandbox.style.margin = "0";

  const clone = node.cloneNode(true) as HTMLElement;
  clone.style.width = `${width}px`;
  clone.style.maxWidth = `${width}px`;
  clone.style.margin = "0";
  clone.style.borderRadius = "0";
  clone.style.boxShadow = "none";
  clone.style.transform = "none";

  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  try {
    await waitForImages(clone);
    const height = Math.ceil(clone.scrollHeight);

    return await html2canvas(clone, {
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      scale: Math.min(window.devicePixelRatio || 2, 3),
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      scrollX: 0,
      scrollY: 0,
    });
  } finally {
    sandbox.remove();
  }
}

export async function downloadElementAsPng(node: HTMLElement, fileName: string) {
  const canvas = await captureElement(node);
  const link = document.createElement("a");
  link.download = fileName;
  link.href = canvas.toDataURL("image/png");
  link.click();
}