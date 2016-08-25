var firstWindow, secondWindow;

$('.start').click(function () {
	firstWindow = window.open("lockscreen.html", "", "width=350, height=350");
	firstWindow.moveTo(100, 100);
	secondWindow = window.open("", "", "width=350, height=350");
	$(secondWindow.document.getElementsByTagName("body")[0]).css("background", "rgb(24, 0, 82)");
	secondWindow.moveTo(10000, 100);
});

window.addEventListener('message', function (event) {
	if (event.data == "finished") {
		postMessageToOtherWindow(firstWindow, "close");
		secondWindow.close();
		window.location = "http://intranet.psych.ch";
	}
	if (event.data == "sendData") {
		let name = $('.name').val();
		let username = $('.username').val();
		postMessageToOtherWindow(firstWindow, [name, username]);
		$('iframe').css("display", "block");
	}
});


function postMessageToOtherWindow(otherWindow, message) {
	if (otherWindow) {
		otherWindow.postMessage(message, "*");
	}
}