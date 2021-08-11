var configJson;
var json_data;
var cart = new Array();
var table_num = null;
var order_process = false;
/*Config取得*/
var xhr = new XMLHttpRequest();
xhr.open('GET', './config.json', true);
xhr.onreadystatechange = function(){
    if((xhr.readyState == 4) && (xhr.status == 200)){
        configJson = JSON.parse(xhr.responseText);
        var name = configJson.name;
        document.getElementById("name").innerHTML = name;
        makeTabButton(configJson.genre);
    }
}
xhr.send(null);

/*Menu取得*/
var xhr2 = new XMLHttpRequest();
xhr2.open('GET', './menu.json', true);
xhr2.onreadystatechange = function(){
    if((xhr2.readyState == 4) && (xhr2.status == 200)){
        json_data = JSON.parse(xhr2.responseText);
        //makeItem(json_data);
    }
}
xhr2.send(null);

/*Iframe読み込み完了後にメニューItemを追加するイベントを呼ぶ*/
document.addEventListener('DOMContentLoaded', event => {
    // HTMLのDOMツリーが読み込み完了した時に実行される

    
    document.getElementById('menu_contents').onload = () => {
      // iframe要素が読み込まれた時に実行される
      makeItem();

      var param = getParam("table");
      if(param != null){
          if(param.length != 3 || param.match(/^[^\x01-\x7E\xA1-\xDF]+$/)){
              alert("URLパラメーターで指定されたテーブル番号が不正です(CODE:03)");
              param="ERR";
          }
          table_num = param;
          document.getElementById("tablenum").innerHTML = "<font color='red'>" + table_num + "</font>";
      }else{
          getTableNum();
      }
  

      cartRefresh();
    };

    document.getElementById('name').addEventListener('contextmenu', function(e) {
        setting();
        e.preventDefault() // 右クリックさせたくない場合
    });

    
    
    window.addEventListener('touchmove', function(event) {
        var allowList = ["scroll", "cart_item", "cartDel"]
        var solved = false;
        allowList.forEach(element => {
            if (event.target.id == element) {
                event.stopPropagation();
                solved = true;
            }
        });
        if(!solved){
            event.preventDefault();
        }
            
        
    },  { passive: false });


  });




//メニューのタブを作る
function makeTabButton(arg){
    var button_w = 'calc(100%/'+ arg.length +')';
    var button_h = '8';
    if(arg.length > 5){
        button_w = '20%';
        button_h = "4";
    }
    if(arg.length > 10){
        alert("ジャンル数が10個を超えています！\n10個以内に減らしてください。(CODE:01)");
    }
    for (let i = 0; i < arg.length; ++i) {
        if(i == 0){
            document.getElementById("menu_tab").innerHTML += '<input type="radio" name="mtab_name" id="mtab' + i+1 + '" checked onclick="makeItem()"><label class="mtab_class" for="mtab' + i+1 + '" style="width: ' + button_w + '; line-height: ' + button_h + 'vh;">' + arg[i] + '</label>';
        }else{
            document.getElementById("menu_tab").innerHTML += '<input type="radio" name="mtab_name" id="mtab' + i+1 + '" onclick="makeItem()"><label class="mtab_class" for="mtab' + i+1 + '" style="width: ' + button_w + '; line-height: ' + button_h + 'vh;">' + arg[i] + '</label>';
        }
      }
}

//メニューのItemを追加する
function makeItem(){
    var jsonData = json_data;
    const elem = document.getElementById('menu_contents');
    const frame = elem.contentWindow.document;
    var target = frame.getElementById('items');
    //alert(jsonData.menu[0].genre);

    let mtabRadio = document.getElementsByName('mtab_name');
    var genre = 0; 
    for(let i = 0; i < mtabRadio.length; ++i){
        if(mtabRadio.item(i).checked){
            var genre = i;
        }
    }
    
    target.innerHTML = "";
    for(let i = 0; i < jsonData.menu.length; ++i){
        if(jsonData.menu[i].genre == genre){
            target.innerHTML += '<div id="item' + i +'" class="item" style="background: url(resource/' + jsonData.menu[i].img + '); background-size: 100% 100%;" onclick="window.parent.addCart(' + i + ')"><p class="title">' + jsonData.menu[i].name + '<br>' + Math.floor(jsonData.menu[i].price * configJson.taxrate).toLocaleString() + '円（税込）</p></div>';
        }
        //alert(jsonData.menu[i].name);
    }
    

}

//カート追加
function addCart(item){
    if(cartCount() == configJson.maxorder){
        alert("一度に承ることができる注文数は\n" + configJson.maxorder + "つまでとさせて頂いております。");
        
        return;
    }

    //すでにカートに入っている商品なら、個数追加の処理をする
    for(let i=0; i < cart.length; ++i){
        if(cart[i].split(",")[0] == json_data.menu[item].num){
            cartDraw();
            cartCng(i, 1);
            viewCart();
            return;
        }
    }

    
    var len = cart.length + 1;
    if(cart[cart.length] == null){
        len = cart.length;
    }
    cart[len] = json_data.menu[item].num + ",1";
    cartRefresh();
    viewCart();
}

//カート表示ボタン
function viewCart(){
    document.getElementById('cart').style.display = 'block';
    document.getElementById('cart_bg').style.display = 'block';
    cartDraw();

}

//注文履歴表示ボタン
function viewRecent(){
    document.getElementById('recent').style.display = 'block';
    document.getElementById('cart_bg').style.display = 'block';
    recentDraw();

}

function recentDraw(){
    order_process = true;
    var xhr_order = new XMLHttpRequest();
    xhr_order.timeout = 10000;
    xhr_order.open('GET', 'http://' + configJson.sv_master + '/R' + table_num, true);
    document.getElementById("recent_list").innerHTML = "サーバーと通信しています...";
    document.getElementById("order_total").innerHTML = "￥-";
    xhr_order.onreadystatechange = function(){
        //alert(xhr_order.responseText);
        if((xhr_order.readyState == 4) && (xhr_order.status == 200)){
            //console.log(xhr_order.responseText);
            var response = xhr_order.responseText.trim();
            document.getElementById("recent_list").innerHTML = "";
            if(response == "err"){
                //現在サーバー側で実装なし
                alert("サーバー側でエラーが発生しました。(CODE:02)");
                order_process = false;
                cartBack();
            }else if(response == "none"){
                document.getElementById("recent_list").innerHTML = "注文履歴なし";
                document.getElementById("order_total").innerHTML = "￥0";
            }else{
                var totalprice_recent = 0;
                var html_block = "";
                response.split(",").forEach(element => {
                    //alert(element);
                    var order = element.split("_");
                    var orderstat = "?";
                    switch(order[1]){
                        case "0":
                            orderstat="　";
                            break;
                        case "1":
                            orderstat="○";
                            break;
                        case "-1":
                            orderstat="消";
                            break;
                        
                    }
                    html_block += "<tr><td id='scroll'>" + getItemName(order[0]) + "</td><td>" + orderstat + "</td></tr>";
                    totalprice_recent += getItemPrice(order[0]);
                });
                document.getElementById("recent_list").innerHTML = '<table class="mid_text table_sticky"><tbody>' + html_block + "</tbody></table>";
                document.getElementById("order_total").innerHTML = "￥" + Math.floor(totalprice_recent * configJson.taxrate).toLocaleString() + "(税込)";
            }
            xhr_order.abort();
            order_process = false;
            
        }
    }
    xhr_order.ontimeout = () => {
        alert("サーバーとの通信ができません。\nお手数をおかけしますが、スタッフをお呼びください。");
        order_process = false;
        cartBack();
    };
    xhr_order.send(null);

}



//注文ボタン
async function cartSend(){

    if(cart.length == 0){
        alert("先に注文内容を決めてください");
        return;
    }

    order_process = true;
    document.getElementById('cart').style.display = 'none';
    document.getElementById('success_icon').style.display = 'none';
    document.getElementById('orderBack').style.display = 'none';
    document.getElementById('cart_success').style.display = 'block';

    document.getElementById("order_send_text").innerHTML = "注文送信中...";

    var s = "";
    for(let i=0; i<cart.length; ++i){
        s = s + "-" + cart[i];
    }

    var request = table_num + ":" + s.slice(1) ;

    var xhr_order = new XMLHttpRequest();
    xhr_order.timeout = 10000;
    xhr_order.open('GET', 'http://' + configJson.sv_master + '/O' + request, true);
    
    xhr_order.onreadystatechange = function(){
        //alert(xhr_order.responseText);
        if((xhr_order.readyState == 4) && (xhr_order.status == 200)){
            document.getElementById("order_send_text").innerHTML = "ご注文ありがとうございます。<br>しばらくお待ちください。<br>" + xhr_order.responseText;
            document.getElementById('orderBack').style.display = 'block';
            document.getElementById('success_icon').style.display = 'block';
            document.getElementById('cart_success').style.display = 'block';
            cart = new Array();
            cartRefresh();
            xhr_order.abort();
            order_process = false;
            
        }
    }
    xhr_order.ontimeout = () => {
        alert("サーバーとの通信ができません。\nお手数をおかけしますが、スタッフをお呼びください。");
        order_process = false;
        cartBack();
    };
    xhr_order.send(null);
    



}
// ミリ秒間待機する(注文イベントDebug用)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//カートの中身を描画するイベント
function cartDraw(){
    document.getElementById("cart_list").innerHTML = "";
    
    for(let i=0; i < cart.length; ++i){
        var cart_i = cart[i].split(",");
        var procItem = json_data.menu.find((v) => v.num == cart_i[0]);
        var itemName = getItemName(cart_i[0]);
        if(itemName.length > 12){
            itemName = itemName.substr( 0, 12 ) + "…";
        }
        document.getElementById("cart_list").innerHTML += '<div class="cart_item" id="cart_item"><img src="resource/' + procItem.img +'" id="scroll" class="cart_i_img"><div class="cart_i_main" id="scroll"><a class="cart_i_title">' + itemName +'</a><div class="cart_i_num"><a class="mid_text">個数:</a><img src="resource/m.svg" class="icon" onclick="cartCng(' + i + ',-1)"><a class="mid_text" id="num' + i + '">' + cart_i[1] + '</a><img src="resource/p.svg" class="icon" onclick="cartCng(' + i + ',1)"><a href="#" class="btn-del" id="cartDel" onclick="cartDel(' + i + ')">削除</a></div></div></div>';

    }

    if(cart.length == 0){
        document.getElementById("cart_list").innerHTML = '<center><a class="mid_text">カートは空です</a></center>';
    }

    cartRefresh();
}

//カートから削除するイベント
function cartDel(arg_n){
    cart.splice(arg_n, 1);
    cartDraw();
}

//カートにはいっている注文の個数を変更するイベント
function cartCng(arg_n, num){
    
    var arg = cart[arg_n].split(",");
    if(Number(arg[1]) == 1 && num == -1){
        return;
    }
    if(cartCount() == configJson.maxorder && num == 1){
        alert("一度に承ることができる注文数は\n" + configJson.maxorder + "つまでとさせて頂いております。");
        viewCart();
        return;
    }
    arg[1] = Number(arg[1]) + Number(num);
    cart[arg_n] = arg[0] + "," + arg[1];
    document.getElementById("num" + arg_n).innerHTML = arg[1];
    //alert(arg[1]);
    cartRefresh();
}

//カートの戻るボタンor背景クリック時
function cartBack(){
    if(order_process){
        return;
    }
    document.getElementById('cart').style.display = 'none';
    document.getElementById('recent').style.display = 'none';
    document.getElementById('cart_bg').style.display = 'none';
    document.getElementById('cart_success').style.display = 'none';
}

//カート合計個数カウント
function cartCount(){
    let c = 0;
    for(let i=0; i < cart.length; ++i){
        c += Number(cart[i].split(",")[1]);
    }
    return c;
}

//カート合計金額(税込)カウント
function cartPriceCount(){
    let p = 0;
    for(let i=0; i < cart.length; ++i){
        var arg = cart[i].split(",");
        var procItem = json_data.menu.find((v) => v.num == arg[0]);
        p += procItem.price * Number(arg[1]);
    }
    return p * configJson.taxrate;
}

//カートの個数表示・合計金額をアップデートするイベント
function cartRefresh(){
    document.getElementById("cartDisp").innerHTML ="カート(" + cartCount() + "点)";
    document.getElementById("cart_total").innerHTML ="￥" + Math.floor(cartPriceCount()).toLocaleString();

}

//テーブル番号設定イベント
function setting(){
    var input = window.prompt("AdminIDを入力してください\n(誤表示の時はキャンセルを押してください)", "");
    if(input == configJson.adminid){
        input = "aaaaa"
        while(input.length > 3){
            input = window.prompt("テーブル番号を入力してください", "");
            if(input.length != 3 || input.match(/^[^\x01-\x7E\xA1-\xDF]+$/)){
                alert("テーブル番号は半角3文字で指定してください！");
                getTableNum();
                return;
            }
        }
        document.cookie = "table=" + input + "; max-age=2147483647";
        alert(document.cookie.split("=")[1] + "に設定されました。");
        location.reload();
    }else{
        if(input != null){
            alert("AdminIDが違います。");
        }
        getTableNum();
    }
}

//テーブル番号取得イベント
function getTableNum(){
    var arg = document.cookie.split("=");
    if(arg[1] == null){
        alert("テーブル番号が指定されていません。\n設定してください。");
        setting();
    }
    table_num = arg[1];
    
    
    document.getElementById("tablenum").innerHTML = table_num;
    
    
}

function getItemName(num){
    var procItem = json_data.menu.find((v) => v.num == num);
    return procItem.name.replace(/<br>/g, '');  
}
function getItemPrice(num){
    var procItem = json_data.menu.find((v) => v.num == num);
    return procItem.price;  
}

function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
