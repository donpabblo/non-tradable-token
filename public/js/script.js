"use strict";

const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;

let web3Modal;
let provider;
let signer;
let selectedAccount;
let network;
let balance;

function init() {
  $.get("api/stats/contract", function (result) {
    $("#emitted").html(result.emitted);
  });

  const providerOptions = {};

  web3Modal = new Web3Modal({
    cacheProvider: false, // optional
    providerOptions, // required
    disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
  });

  console.log("Web3Modal instance is", web3Modal);
}



async function fetchAccountData() {
  try {
    $("#get-section").hide();
    $("#card-section").hide();
    let netInfo = await provider.getNetwork();
    network = netInfo.chainId == 31337 ? 'localhost' : netInfo.name;
    selectedAccount = (await provider.listAccounts())[0];
    balance = ethers.utils.formatEther(await provider.getBalance(selectedAccount));
    $("#get-section").hide();
    $("#card-section").hide();
  } catch (error) {
    alert(error.message);
  }
}

async function checkNetwork() {
  try {
    let envNetwork = await $.get("api/env");
    let network = await provider.getNetwork();
    if (network.chainId.toString() != envNetwork.network_id) {
      await provider.send("wallet_switchEthereumChain", [{ chainId: envNetwork.network_id_hex }]);
      await fetchAccountData();
    }
  } catch (error) {
    if (error.code === 4902) {
      try {
        await provider.send("wallet_addEthereumChain",
          [
            {
              chainId: envNetwork.network_id_hex,
              chainName: envNetwork.name,
              rpcUrls: envNetwork.rpcUrls,
              nativeCurrency: envNetwork.nativeCurrency,
              blockExplorerUrls: envNetwork.blockExplorerUrls,
            },
          ],
        );
        await provider.send("wallet_switchEthereumChain", [{ chainId: envNetwork.network_id_hex }]);
        await fetchAccountData();
      } catch (error) {
        alert(error.message);
      }
    }
  }
}

async function onConnect() {
  try {
    $("#loader").show();
    let instance = await web3Modal.connect();
    provider = new ethers.providers.Web3Provider(instance, "any");
    signer = provider.getSigner();
    // Subscribe to accounts change
    window.ethereum.on("accountsChanged", async (accounts) => {
      await fetchAccountData();
    });

    // Subscribe to chainId change
    window.ethereum.on("chainChanged", async (chainId) => {
      await fetchAccountData();
    });

    await fetchAccountData(provider);
    $("#connect-section").hide();
    $("#action-section").show();
  } catch (e) {
    console.log("Could not get a wallet connection", e);
  } finally {
    $("#loader").hide();
  }
}

async function onDisconnect() {

  if (provider.close) {
    await provider.close();
    await web3Modal.clearCachedProvider();
  }

  provider = null;
  selectedAccount = null;
  balance = null;
  network = null;
  signer = null;

  $("#connect-section").show();
  $("#action-section").hide();
  $("#get-section").hide();
  $("#card-section").hide();
}

async function checkAttendance() {
  $("#loader").show();
  try {
    await checkNetwork();
    let ownedTokens = await $.get("/api/stats/owner/" + selectedAccount);
    if (ownedTokens.balance > 0 && ownedTokens.valid) {
      $("#card-title").html("Congratulations!");
      $("#card-subtitle").html("You own the token");
    } else {
      $("#card-title").html("Sorry!");
      $("#card-subtitle").html("You do NOT own the token");
    }
    $("#address").html("Account: " + selectedAccount);
    $("#network").html("Network: " + network);
    $("#balance").html("Balance: " + balance);
    $("#get-section").hide();
    $("#card-section").show();
  } catch (e) {
    console.log("Could not get token balance", e);
  } finally {
    $("#loader").hide();
  }
}

async function getToken() {
  $("#loader").show();
  try {
    await checkNetwork();
    let signature = await signer.signMessage(selectedAccount);
    let mintResult = await $.post("api/mint", { address: selectedAccount, signature: signature });
    if (mintResult.error) {
      $("#mintResult").html("ERROR " + JSON.stringify(mintResult.error));
    } else {
      $("#mintResult").html("You got the NTT Token!");
      let emitted = parseInt($("#emitted").html());
      $("#emitted").html(emitted + 1);
    }
    $("#get-section").show();
    $("#card-section").hide();
  } catch (e) {
    console.log("Could not get token", e);
  } finally {
    $("#loader").hide();
  }
}

async function sendMetaTx() {
  let color = document.querySelector("#color").value;
  if (color) {
    document.querySelector("#loader").style.display = "block";
    document.querySelector("#metatx").style.display = "none";
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", 'api/metatx/' + selectedAccount + '/' + color, true);//TODO
    xmlHttp.responseType = 'json';
    xmlHttp.onload = function () {
      var status = xmlHttp.status;
      if (status === 200) {
        var metatx = xmlHttp.response.metatx;
        var callback = xmlHttp.response.callback;
        var params = [selectedAccount, JSON.stringify(metatx)];
        var method = 'eth_signTypedData_v4';
        provider.sendAsync(
          {
            method,
            params,
            selectedAccount,
          },
          function (err, result) {
            if (err) {
              document.querySelector("#loader").style.display = "none";
              return console.dir(err);
            }
            if (result.error) {
              alert(result.error.message);
              document.querySelector("#loader").style.display = "none";
            }
            if (result.error) return console.error('ERROR', result);
            console.log('TYPED SIGNED:' + JSON.stringify(result.result));

            var xhr = new XMLHttpRequest();
            xhr.open("POST", callback, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify({
              metatx: metatx,
              signature: result.result
            }));
            xhr.onload = function () {
              if (xhr.readyState == 4)
                if (xhr.status == 200) {
                  var json_data = JSON.parse(xhr.response);
                  document.querySelector("#metatx").style.display = "block";
                  document.querySelector("#fee").textContent = json_data.fee + ' GWEI';
                  document.querySelector("#paymaster").textContent = json_data.paymaster;
                }
              document.querySelector("#loader").style.display = "none";
            };
          }
        );
      } else {
        console.error('ERROR', xmlHttp.response);
        document.querySelector("#loader").style.display = "none";
      }
    };
    xmlHttp.send();
  } else {
    alert('Missing color')
  }
}

$(document).ready(function () {
  init();
  $("#connect").click(function () {
    onConnect();
  });
  $("#disconnect").click(function () {
    onDisconnect();
  });
  $("#check").click(function () {
    checkAttendance();
  });
  $("#get").click(function () {
    getToken();
  });
});