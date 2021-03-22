let currentAccount;
let lastTransactionTime;
let invested;
let params;
let amountuser;
let statstotalprof;
let walletTronWeb;
let contract;
let siteLoading = true;
let acctConnected = false;
let lastTrans = null;


const defaultSponsor = 'TJ9Suno4rZWSUCkr9MsqrJv66s9EkxpqZB';
//const contractAddress = 'TCLivb8XJgLgioRAz9Uvw3nbJe88wEyKMp';
const contractAddress = 'TUmLrD2L8bjig68Hw7kzqa6aTmkkVxjmGv';
const serverUrl = 'https://tronflowplus.herokuapp.com/';
const tronScan = 'https://tronscan.org/#/transaction/';

function startInterval(seconds, callback) {
  callback();
  return setInterval(callback, seconds * 1000);
}

const copy = () => {
  /* Get the text field */
  var copyText = document.getElementById('accountRef');

  /* Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 99999); /*For mobile devices*/

  /* Copy the text inside the text field */
  document.execCommand('copy');

  showPopup('Copied', 'success');
};

const thousandsSeparators = (num) => {
  var num_parts = num.toString().split('.');
  num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return num_parts.join('.');
};

 const showPopup = (msg, type, secs = 4) => {
  $(`#popup-${type}-msg`).html(msg);

  $('.popup').removeClass('show');

  $(`.${type}-popover`).addClass('show');
  if (secs) {
    window.setTimeout(() => {
      $(`.${type}-popover`).removeClass('show');
    }, secs * 1000);
  }
}; 

const runCounter = (id, value) => {
  $({ Counter: 0 }).animate(
    {
      Counter: value,
    },
    {
      duration: 1000,
      easing: 'swing',
      step: function (now) {
        $(id).val(now.toFixed(6));
      },
    }
  );
};

const newTransaction = (amount) => {
  $(`#custom-popover-msg`).html(amount + ' TRX Deposited');

  $('.custom-popover').addClass('custom-popover-active');
  window.setTimeout(() => {
    $('.custom-popover').removeClass('custom-popover-active');
  }, 3000);
}; 



const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider('https://api.trongrid.io');
const solidityNode = new HttpProvider('https://api.trongrid.io');
const eventServer = 'https://api.trongrid.io/';
const privateKey = "E07FA44D864D5EC8DFF590C65E36029E28513DC2AF6CB345C772FFC857926DEC";
//const customTronWeb = new TronWeb(fullNode, solidityNode, eventServer);
 const customTronWeb = new TronWeb(fullNode, solidityNode, eventServer,privateKey);
customTronWeb.setAddress(contractAddress);
customTronWeb.setHeader({"TRON-PRO-API-KEY": 'd2b51f45-c9cc-4e8c-a16e-9ff82dbe277d'});

 function getDataFromServer() {
  let url = `${serverUrl}api/events/today`;
  if (currentAccount) {
    const currentUser =
      '0x' + customTronWeb.address.toHex(currentAccount).substr(2);
    url = `${serverUrl}api/events/today?userAddress=${currentUser}`;
  }
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.user) {
        let amount = customTronWeb.fromSun(data.user.amount);
        amountuser = amount;
        $('#deposits22').text(amount);
      } else {
        $('#deposits22').text(0);
      }
      data.topFiveTrans.forEach((trans, i) => {
        let amount = customTronWeb.fromSun(trans.result.amount);
        $(`#today-${i}`).removeClass('d-none');
        $(`#today-${i}-amount`).text(parseFloat(amount).toFixed(2) + ' TRX');
        $(`#today-${i}-address`).val(
          customTronWeb.address.fromHex(trans.result.user)
        );
        $(`#today-${i}-link`).attr(
          'href',
          `${tronScan}${trans.transaction_id}`
        );
      });

      data.lastFiveTrans.forEach((trans, i) => {
        let amount = customTronWeb.fromSun(trans.result.amount);
        if (i == 0) {
          if (lastTrans && lastTrans != trans._id) {
            newTransaction(amount);
            lastTrans = trans._id;
          } else {
            lastTrans = trans._id;
          }
        }
        $(`#last-${i}`).removeClass('d-none');
        $(`#last-${i}-amount`).text(parseFloat(amount).toFixed(2) + ' TRX');
        $(`#last-${i}-address`).val(
          customTronWeb.address.fromHex(trans.result.user)
        );
        $(`#last-${i}-link`).attr('href', `${tronScan}${trans.transaction_id}`);
      });
    });
}

//startInterval(30, getDataFromServer);

 function getLastDayTopDeposits() {
  fetch(`${serverUrl}api/events/last-day`)
    .then((response) => response.json())
    .then((data) => {
      data.forEach((trans, i) => {
        let amount = customTronWeb.fromSun(trans.result.amount);
        $(`#last-day-${i}`).removeClass('d-none');
        $(`#last-day-${i}-amount`).text(parseFloat(amount).toFixed(2) + ' TRX');
        $(`#last-day-${i}-address`).val(
          customTronWeb.address.fromHex(trans.result.user)
        );
        $(`#last-day-${i}-link`).attr(
          'href',
          `${tronScan}${trans.transaction_id}`
        );
      });
    });
}
//getLastDayTopDeposits(); 

$(document).ready(async () => {
  const url = new URL(window.location);
  params = new URLSearchParams(url.search);

  loadContract();

  if (window.tronWeb && window.tronWeb.ready) {
    walletTronWeb = window.tronWeb;
    loadNewContract();
  }

  const connectWallet = setInterval(() => {
    if (walletTronWeb) {
      clearInterval(connectWallet);
    } else if (window.tronWeb && window.tronWeb.ready) {
      walletTronWeb = window.tronWeb;
      loadNewContract();
    }
  }, 200);

  setTimeout(() => {
    if (!walletTronWeb) {
      clearInterval(connectWallet);
      showPopup(
        'Unable to connect to Wallet. Try Refreshing the site.',
        'error',
        15
      );
    }
  }, 15000);
});

const getTotalInvested = async () => {
  let totalInvested = await contract.totalInvested().call();
  $('#totalInvested').text(
    thousandsSeparators(parseInt(totalInvested.toNumber() / 1000000))
  );
};

/*const getContractBalanceRate = async () => {
  let contractBalanceRate = await contract.getContractBalanceRate().call();
  $('#roi').text((contractBalanceRate.toNumber() / 10 + 1).toFixed(1));
}; */

const getTotalInvestors = async () => {
  let totalInvestors = await contract.totalPlayers().call();
  $('#totalInvestors').text(thousandsSeparators(totalInvestors.toNumber()));
  
  
};

const getBalanceOfContract = async () => {
  return customTronWeb.trx.getBalance(contractAddress).then((res) => {
    const contbalance = parseInt(res / 1000000);
    if (contbalance) {
      $('#contbalance').text(thousandsSeparators(contbalance));
    } else {
      $('#contbalance').text(0);
    }
    return contbalance;
  });
};

const getLastfive = async () => {

let inputVal =document.getElementById("last0ad").value;
 

 let last1 = await contract.last1().call();
 let last1ad = await contract.last1ad().call();
 let last2 = await contract.last2().call();
 let last2ad = await contract.last2ad().call();
 let last3 = await contract.last3().call();
 let last3ad = await contract.last3ad().call();
 let last4 = await contract.last4().call();
 let last4ad = await contract.last4ad().call();
 let last5 = await contract.last5().call();
 let last5ad = await contract.last5ad().call();



//alert(inputVal);
let inputcompare = customTronWeb.address.fromHex(last1ad);

if ((inputVal != inputcompare) && (inputVal != "")) {
          let newlast1 = parseFloat(last1/1000000).toFixed(2);
            newTransaction(newlast1);
            
         } 



 $('#last0').text(parseFloat(last1/1000000).toFixed(2) + ' TRX');
 $('#last0ad').val(customTronWeb.address.fromHex(last1ad));
 $('#last1').text(parseFloat(last2/1000000).toFixed(2) + ' TRX');
 $('#last1ad').val(customTronWeb.address.fromHex(last2ad));
 $('#last2').text(parseFloat(last3/1000000).toFixed(2) + ' TRX');
 $('#last2ad').val(customTronWeb.address.fromHex(last3ad));
 $('#last3').text(parseFloat(last4/1000000).toFixed(2) + ' TRX');
 $('#last3ad').val(customTronWeb.address.fromHex(last4ad));
 $('#last4').text(parseFloat(last5/1000000).toFixed(2) + ' TRX');
 $('#last4ad').val(customTronWeb.address.fromHex(last5ad));


};

const getTopfive = async () => {
 let top1 = await contract.top1().call();
 let top1ad = await contract.top1ad().call();
 let top2 = await contract.top2().call();
 let top2ad = await contract.top2ad().call();
 let top3 = await contract.top3().call();
 let top3ad = await contract.top3ad().call();
 let top4 = await contract.top4().call();
 let top4ad = await contract.top4ad().call();
 let top5 = await contract.top5().call();
 let top5ad = await contract.top5ad().call();
 let lasttop1 = await contract.lasttop1().call();
 let lasttop1ad = await contract.lasttop1ad().call();
 let lasttop2 = await contract.lasttop2().call();
 let lasttop2ad = await contract.lasttop2ad().call();
 let lasttop3 = await contract.lasttop3().call();
 let lasttop3ad = await contract.lasttop3ad().call();
 let lasttop4 = await contract.lasttop4().call();
 let lasttop4ad = await contract.lasttop4ad().call();
 let lasttop5 = await contract.lasttop5().call();
 let lasttop5ad = await contract.lasttop5ad().call();
 


 $('#top1').text(parseFloat(top1/1000000).toFixed(2) + ' TRX');
 $('#top1ad').val(customTronWeb.address.fromHex(top1ad));
 $('#top2').text(parseFloat(top2/1000000).toFixed(2) + ' TRX');
 $('#top2ad').val(customTronWeb.address.fromHex(top2ad));
 $('#top3').text(parseFloat(top3/1000000).toFixed(2) + ' TRX');
 $('#top3ad').val(customTronWeb.address.fromHex(top3ad));
 $('#top4').text(parseFloat(top4/1000000).toFixed(2) + ' TRX');
 $('#top4ad').val(customTronWeb.address.fromHex(top4ad));
 $('#top5').text(parseFloat(top5/1000000).toFixed(2) + ' TRX');
 $('#top5ad').val(customTronWeb.address.fromHex(top5ad));
 $('#lasttop1').text(parseFloat(lasttop1/1000000).toFixed(2) + ' TRX');
 $('#lasttop1ad').val(customTronWeb.address.fromHex(lasttop1ad));
 $('#lasttop2').text(parseFloat(lasttop2/1000000).toFixed(2) + ' TRX');
 $('#lasttop2ad').val(customTronWeb.address.fromHex(lasttop2ad));
 $('#lasttop3').text(parseFloat(lasttop3/1000000).toFixed(2) + ' TRX');
 $('#lasttop3ad').val(customTronWeb.address.fromHex(lasttop3ad));
 $('#lasttop4').text(parseFloat(lasttop4/1000000).toFixed(2) + ' TRX');
 $('#lasttop4ad').val(customTronWeb.address.fromHex(lasttop4ad));
 $('#lasttop5').text(parseFloat(lasttop5/1000000).toFixed(2) + ' TRX');
 $('#lasttop5ad').val(customTronWeb.address.fromHex(lasttop5ad));



};


const contractData = () => {
  getTotalInvested();
  getTotalInvestors();
//  getContractBalanceRate();
  getBalanceOfContract();
  getLastfive();
  getTopfive(); 

  
	
}; 

const loadContract = async () => {
  contract = await customTronWeb.contract().at(contractAddress);
	
  startInterval(30, contractData);
}; 

const loadNewContract = async () => {
  contract = await walletTronWeb.contract().at(contractAddress);
  if (walletTronWeb.defaultAddress.base58) {
    showPopup('Connected to Tron LINK.', 'success');
    acctConnected = true;
    startInterval(5, accountData);
    
  } else {
    showPopup('Unable to Connect to your Account in Wallet.', 'error');
  }
};

const getDeposit = async () => {
  let invester = await contract.players(currentAccount).call();
  const deposit = invester.trxDeposit.toNumber() / 1000000;
  return deposit.toFixed(6);
};

const getProfit = async () => {
  return await contract.getProfit(currentAccount).call();
};

const getBalanceOfAccount = async () => {
  return walletTronWeb.trx.getBalance(currentAccount).then((res) => {
    const balance = parseInt(res / 1000000);
    if (balance) {
      $('#balance').text(balance);
    } else {
      $('#balance').text(0);
    }
    return balance;
  });
};


 const secondsToDhms = async () => {
 let invester = await contract.players(currentAccount).call();
 let time = Math.floor(Date.now() / 1000);
 let usertimewith = invester.withdrawtime.toNumber();
//alert(Math.floor(Date.now() / 1000));

let seconds = Number(parseFloat(usertimewith) - parseFloat(time));
if(seconds < 0) {
seconds = 0;
};

//let seconds = parseFloat(usertimewith) - 10000000;
let d = Math.floor(seconds / (3600*24));
let h = Math.floor(seconds % (3600*24) / 3600);
let m = Math.floor(seconds % 3600 / 60);
let s = Math.floor(seconds % 60);

$('#withday').text(d + ' days : ');
$('#withhour').text(h + ' hours : ');
$('#withminute').text(m + ' minutes : ');
$('#withsec').text(s + ' seconds'); 



 }; 






const getUserStats = async () => {
  let invester = await contract.players(currentAccount).call();
  $('#address2').text(currentAccount);
  const userpayout = (((invester.payoutSum.toNumber() / 1000000) * 10) / 7);
  $('#userpayout').text(userpayout.toFixed(2));
  const sponsoraddress1 = invester.affFrom;
  const sponsoraddress = walletTronWeb.address.fromHex(sponsoraddress1);
  if (sponsoraddress == 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb') {
    $('#sponsoraddress').text('You have no Sponsor');
  } else {
    $('#sponsoraddress').text(sponsoraddress);
  }
  const userdeposits = invester.playerdeposit.toNumber() / 1000000;
  $('#deposits').text(userdeposits.toFixed(2));

  
  const refrewards = invester.affRewards.toNumber() / 1000000;
  const aff1 = invester.aff1sum.toNumber();
  const aff2 = invester.aff2sum.toNumber();
  const aff3 = invester.aff3sum.toNumber();
  const aff4 = invester.aff4sum.toNumber();
  const aff5 = invester.aff5sum.toNumber();
  $('#refrewards').text(refrewards.toFixed(2));
  $('#aff1').text(aff1);
  $('#aff2').text(aff2);
  $('#aff3').text(aff3);
  $('#aff4').text(aff4);
  $('#aff5').text(aff5);
  $('#refrewards2').text(refrewards.toFixed(2));
  $('#aff11').text(aff1);
  $('#aff22').text(aff2);
  $('#aff33').text(aff3);
  $('#aff44').text(aff4);
  $('#aff55').text(aff5);	
  $('#statsactivecap').text(invested);



  const userreinvest = invester.playerreinvest.toNumber() / 1000000;
   $('#statsreinvest').text(userreinvest.toFixed(2));
    

  $('#statsinaccap').text(
    parseFloat(
      parseFloat($('#statsreinvest').text() / 2) +
        parseFloat($('#userpayout').text() / 2)
    ).toFixed(2)
  );
  $('#statstotalcap').text(
    parseFloat(
      parseFloat($('#statsinaccap').text()) + parseFloat(invested)
    ).toFixed(2)
  );
  $('#statsciwith').text(
    parseFloat(
      parseFloat($('#statsreinvest').text()) +
        parseFloat($('#userpayout').text())
    ).toFixed(2)
  );

  $('#statscigenerated').text(
    parseFloat(
      parseFloat($('#statsreinvest').text()) +
        parseFloat($('#userpayout').text()) +
        parseFloat(statstotalprof)
    ).toFixed(2)
  );

  $('#statstotaldouble').text(
    parseFloat(
      parseFloat(parseFloat($('#statsinaccap').text()) + parseFloat(invested)) *
        2
    ).toFixed(2)
  );

  $('#statscipending').text(
    parseFloat(
      parseFloat($('#statstotaldouble').text()) -
        parseFloat($('#statscigenerated').text())
    ).toFixed(2)
  );
};

const accountData = async () => {
  if (walletTronWeb.defaultAddress.base58) {
    if (
      currentAccount &&
      currentAccount !== walletTronWeb.defaultAddress.base58
    ) {
      currentAccount = walletTronWeb.defaultAddress.base58;
      showPopup('Account Changed.', 'success');
    } else {
      currentAccount = walletTronWeb.defaultAddress.base58;
    }
    $('#address').text(currentAccount);

    getUserStats();
    secondsToDhms();



    

    invested = await getDeposit();
    let profit, totalProfit, halfProfit;
    if (parseInt(invested) > 0) {
      profit = await getProfit(contract);
      totalProfit = (profit.toNumber() / 1000000).toFixed(6);
      halfProfit = (profit.toNumber() / 2000000).toFixed(6);
      statstotalprof = (profit.toNumber() / 1000000).toFixed(6);
      $('#statstotalprof').text(statstotalprof);
      $('#refererAddress').val('You Already have a Sponsor');
      $('#refererAddress').prop('disabled', true);
      $('#accountRef').val('https://tronflowplus.net/?ref=' + currentAccount);
    } else {
      if (params.has('ref')) {
        $('#refererAddress').prop('disabled', true);
        $('#refererAddress').val(params.get('ref'));
      } else if ($('#refererAddress').val() == 'You Already have a Sponsor') {
        $('#refererAddress').prop('disabled', false);
        $('#refererAddress').val('');
      }
      $('#accountRef').val(
        'You need to invest at least 1000 TRX to activate the referral link.'
      );
      invested = totalProfit = halfProfit = 0;
    }
    if (siteLoading) {
      siteLoading = false;
      runCounter('#actualCapital', invested);
      runCounter('#withdrawableAmount', halfProfit);
      runCounter('#withdrawableInterest', halfProfit);
      runCounter('#totalWithdrawable', totalProfit);
    } else {
      $('#actualCapital').val(invested);
      $('#withdrawableAmount').val(halfProfit);
      $('#withdrawableInterest').val(halfProfit);
      $('#totalWithdrawable').val(totalProfit);
    }
    $('.deduction').text(halfProfit);
    $('#invested').text(totalProfit);
    $('#withdrawed').text(totalProfit);
    $('#withdrawal').text(((totalProfit * 2) / 10).toFixed(6) );
    $('#insur').text((totalProfit / 10).toFixed(6));
    $('#reinvest-new-balance').text(
      parseFloat(
        parseFloat($('#actualCapital').val()) + parseFloat(halfProfit)
      ).toFixed(6)
    );
    $('#withdrawal-new-balance').text(
      parseFloat(
        parseFloat($('#actualCapital').val()) - parseFloat(halfProfit) + parseFloat(totalProfit / 5)
      ).toFixed(6)
    );
    getBalanceOfAccount();
  } else {
    showPopup('Tron LINK is disconnected. Please Refresh!', 'error');
    acctConnected = false;
  }
};

// deposit your fund!
async function deposit() {
  let address = $('#refererAddress').val();
  let amount = $('#depositAmount').val();
  if (walletTronWeb && acctConnected) {
    if (!walletTronWeb.isAddress(address) && parseInt(invested) < 1) {
      showPopup('Please Enter Right Address', 'error');
    } else if (amount < 1000) {
      showPopup('Minimum Amount is 1000 TRX', 'error');
    } else if (amount > (await getBalanceOfAccount())) {
      showPopup('Insufficient Balance', 'error');
    } else if ((await getBalanceOfAccount()) - amount < 105) {
      showPopup(
        'You need a few(95-105) TRX in your wallet to make an transaction',
        'error'
      );
    } else {
      if (parseInt(invested) > 0) {
        address = defaultSponsor;
      }
      let contract = await walletTronWeb.contract().at(contractAddress);
      contract
        .deposit(address)
	    
        .send({
	  feeLimit: 250000000,    
          callValue: walletTronWeb.toSun(amount),
        })
        .then((output) => {
          console.info('Hash ID:', output, '\n');
          showPopup('Deposit Successful', 'success');
        });
    }
  } else {
    showPopup('TronWeb is not Connected', 'error');
  }
}

// withDraw your fund!
async function withdraw() {
 let invester = await contract.players(currentAccount).call();
 let time = Math.floor(Date.now() / 1000);
 let usertimewith = invester.withdrawtime.toNumber();

 let seconds = Number(parseFloat(usertimewith) - parseFloat(time));
	
 if (seconds <= 0){	
  if (walletTronWeb && acctConnected) {
    let contract = await walletTronWeb.contract().at(contractAddress);
    await contract
      .withdraw()
      .send({
	  feeLimit: 150000000,    
          
        })
      .then((output) => {
        console.info('HashId:' + ' ' + output);
        showPopup('Withdraw Successful', 'success');
      });
  } else {
    showPopup('TronWeb is not Connected', 'error');
  }
} 
else {
 showPopup('Your countdown to withdraw is not finished', 'error');
}
	
	
}

// reinvest your fund!
async function reinvest() {
  if (walletTronWeb && acctConnected) {
    let contract = await walletTronWeb.contract().at(contractAddress);
    await contract
      .reinvest()
      .send({
	  feeLimit: 150000000,    
          
        })
      .then((output) => {
        console.info('HashId:' + ' ' + output);
        showPopup('Reinvest Successful', 'success');
      });
  } else {
    showPopup('TronWeb is not Connected', 'error');
  }
}
