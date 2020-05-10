(function () {
	function setUtterancesTheme() {
		let theme = window.localStorage.getItem("theme") || "light";
		let msg = {
			type: "set-theme",
			theme: "github-dark"
		};
		if (theme == "light") {
			msg.theme = "github-light"
		}
		document.querySelector('.utterances-frame').contentWindow.postMessage(msg, 'https://utteranc.es')
	}

	document.querySelector('.theme-toggle').addEventListener("click", () => {
		setTimeout(setUtterancesTheme, 500);
	})
	setTimeout(setUtterancesTheme, 2000);
})();