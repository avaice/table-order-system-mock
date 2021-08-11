function clockUpdate(){
    var nowTime = new Date(); //  現在日時を得る
    var nowMonth = nowTime.getMonth() + 1; // 月を抜き出す
    var nowDay = nowTime.getDay() + 1; // 日を抜き出す
    var dayOfWeekStr = [ "日", "月", "火", "水", "木", "金", "土" ][nowDay-1] ;	// 曜日(日本語表記)
    var nowHour = ("00" + nowTime.getHours()).slice(-2); // 時を抜き出す
    var nowMin  = ("00" + nowTime.getMinutes()).slice(-2); // 分を抜き出す
    var nowSec  = ("00" + nowTime.getSeconds()).slice(-2); // 秒を抜き出す
    var msg = nowMonth + "/" + nowDay + "(" + dayOfWeekStr + ")" + nowHour + ":" + nowMin + ":" + nowSec;
    document.getElementById("RealtimeClockArea").innerHTML = msg;
}

setInterval('clockUpdate()',1000);

