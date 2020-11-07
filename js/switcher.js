let switcherOpen = false;

function toggleSwitcher() {
	const btns = Array.from(document.getElementsByClassName("love-bar_button"));
	const menu = document.getElementById("love-bar");

	if (switcherOpen) {
		const menuHeight = menu.offsetHeight;
		menu.style.transform = "translate(0px, -100%)";
		menu.style.marginBottom = `-${menuHeight}px`;
		const endListener = () => {
			if (!switcherOpen) {
				menu.style.display = "none";
				menu.style.transition = "";
			}
			menu.removeEventListener("transitionend", endListener);
		};

		menu.addEventListener("transitionend", endListener);
		btns.forEach((btn) => {
			btn.classList.remove("love-bar_button__open");
			btn.setAttribute("aria-expanded", false);
		});
	} else {
		menu.style.transform = "translate(0px, -100%)";
		menu.style.display = "";
		const menuHeight = Math.round(menu.offsetHeight);
		menu.style.marginBottom = `-${menuHeight}px`;
		// We need to cause some layout thrash to get our animation to work the
		// way we want it to
		menu.clientHeight;
		menu.style.transition = `transform 0.6s cubic-bezier(0.68, -0.6, 0.32, 1.6), 
			margin-bottom 0.6s cubic-bezier(0.68, -0.6, 0.32, 1.6)`;
		menu.style.marginBottom = `0px`;
		menu.style.transform = "translate(0px, 0px)";
		btns.forEach((btn) => {
			btn.classList.add("love-bar_button__open");
			btn.setAttribute("aria-expanded", true);
		});
	}

	switcherOpen = !switcherOpen;
}

function setupSwitcher() {
	const btns = Array.from(document.getElementsByClassName("love-bar_button"));
	const menu = document.getElementById("love-bar");

	btns.forEach((btn) => {
		btn.addEventListener("click", toggleSwitcher);
		btn.classList.remove("love-bar_button__hidden");
		btn.setAttribute("aria-expanded", false);
		btn.setAttribute("aria-controls", "love-bar");
	});
	menu.style.display = "none";
}

setupSwitcher();
document.body.clientHeight;
document.body.classList.add("love-interactive");
