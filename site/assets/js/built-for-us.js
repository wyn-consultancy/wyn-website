// Built for us page: the newsroom pipeline. Click a step to read it; it also walks itself through once it's on screen.
(function () {
  const pipe = document.querySelector("[data-pipe]");
  if (!pipe) return;
  const steps = [...pipe.querySelectorAll(".pipe-steps li")];
  const details = [...pipe.querySelectorAll(".pipe-detail")];
  const dot = pipe.querySelector(".pipe-dot");
  let current = 0, timer = null;
  const show = (i) => {
    current = i;
    steps.forEach((li, k) => li.querySelector("button").setAttribute("aria-pressed", String(k === i)));
    details.forEach((d, k) => d.classList.toggle("is-on", k === i));
    if (dot) dot.style.left = `calc(${(i + 0.5) / steps.length * 100}% - 6px)`;
  };
  const stop = () => { clearInterval(timer); timer = null; };
  steps.forEach((li, i) => li.querySelector("button").addEventListener("click", () => { stop(); show(i); }));
  show(0);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();
    timer = setInterval(() => (current < steps.length - 1 ? show(current + 1) : stop()), 4200);
  }, { threshold: 0.5 }).observe(pipe);
})();
