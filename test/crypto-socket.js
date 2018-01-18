cryptoSocket = require("test/crypto-socket")
cryptoSocket.start();

// listen to ETHBTC on bitfinex,bitmex,and cex.
cryptoSocket.start("bitfinex",["ETHBTC"])
// cryptoSocket.start("bitmex","ETHBTC")
// cryptoSocket.start("cex","ETHBTC")

// print out quotes every 1000 ms (1 second)
setInterval(
    function(){
        cryptoSocket.echoExchange()
    },1000);