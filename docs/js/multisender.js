
App = {
    owner:null,
    gasUsed: 0,
    web3Provider: null,
    contracts: {},
    explorerUrl:'',
    account: 0X0,
    loading: false,
    adresandBalanc: [],
    count: 0,
    parseCompleted: false,
    format:'',
    multiplier: 10 ** 18,
    totalNumberTx: 1,
    totalCostInEth: '0',
    totalBalanceWithDecimals: '0',
    tokenStore: {
        decimals: 18, //
        jsonAddresses: [{ "0x0": "0" }],
        tokenAddress: '',
        defAccTokenBalance: '',
        allowance: '',
        currentFee: '',
        tokenSymbol: '',
        ethBalance: '',//
        balances_to_send: [],
        addresses_to_send: [],
        invalid_addresses: [],
        filteredAddresses: [],
        totalBalance: '0',
        arrayLimit: 0,
        errors: [],
        dublicates: [],
        proxyMultiSenderAddress: null,
    },
    gasPriceStore: {
        gasPrices: {},
        loading: true,
        gasPricesArray: [
            { label: 'fast', value: '21' },
            { label: 'standard', value: '21' },
            { label: 'slow', value: '21' },
            { label: 'instant', value: '21' },
        ],
        selectedGasPrice: '22',
        gasPricePromise: null,
        standardInHex: 0x15,
    },
    txStore: {
        txs: [],
        txHashToIndex: {},
        approval: '',
        interval: null,
        keepRunning: false,
    },
    // window.web3.utils: require('web3-utils'),

    init: async () => {
        App.adresandBalanc = App.getAddresses(1000);
        

       // App.window.web3.utils = new window.web3.utils();
       //console.log(App.window.web3.utils);
        App.nextStep();
        App.onFileUpdate();
        return App.initWeb3();//logPostulerListener
    },

    initWeb3: async () => {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            try {
                await window.ethereum.enable();
                await App.initContract();
                App.displayAccountInfo();
                console.log("web3 is initilized")
                return App.initContract();
            } catch (error) {
                //user denied access
                console.error("Unable to retrieve your accounts! You have to approve this application on Metamask");
            }
        } else if (window.web3) {
            window.web3 = new Web3(web3.currentProvider || "ws://localhost:7545");
            await App.initContract();
            App.displayAccountInfo();


            return App.initContract();
        } else {
            //no dapp browser
            console.log("Non-ethereum browser detected. You should consider trying Metamask");
        }
    },

    displayAccountInfo: async () => {
        console.log("displayAccountInfo demende===========================>", App.count);
        App.count++;
        await App.getEthBalance();
        await App.getOwner();
        await App.getDecimals();
        await App.getAllowance();
        await App.getCurrentFee();
        await App.getArrayLimit();
        await App.getTokenSymbol();
        await App.getMultiplier();
        await App.getBalance();
        await App.addressTokenSetUp();
        await App.getGasPrices();
        const BtuTokenInstance = await App.contracts.BtuTokenArtifact.deployed();
        const tSupply = await BtuTokenInstance.totalSupply();
        var totalSupply = new BigNumber(tSupply).div(App.multiplier).toString(10);
        console.log(App.multiplier)
        console.log(totalSupply);
        $('#totalSupply').text("Total supply: " + totalSupply + " BTU ================================>")

        console.log(App.tokenStore)
    },

    initContract: async () => {
        console.log("initContract demende===========================>", App.count);
        const networkId = await window.web3.eth.net.getId()
        let res = await App.netWorkInfo(networkId);
        App.explorerUrl = res.explorerUrl;
        App.count++;
        $.getJSON('BtuToken.json', BtuTokenArtifact => {
            App.contracts.BtuTokendeployedAddress = BtuTokenArtifact.networks[networkId].address
            App.contracts.BtuTokenArtifact = TruffleContract(BtuTokenArtifact);
            App.contracts.BtuTokenArtifact.setProvider(window.web3.currentProvider);
            console.log(App.contracts.BtuTokendeployedAddress)
        });
        $.getJSON('MultiSender.json', MultiSenderArtifact => {
            App.tokenStore.proxyMultiSenderAddress = MultiSenderArtifact.networks[networkId].address
            App.contracts.MultiSenderArtifact = TruffleContract(MultiSenderArtifact);
            App.contracts.MultiSenderArtifact.setProvider(window.web3.currentProvider);
            //console.log(App.contracts.MultiSenderArtifact.address)
            return App.listenToEvents();
        });
    },

    // Listen to events raised from the contract
    listenToEvents: async () => {
      console.log("listenToEvents demende===========================>");
      const BtuTokenInstance = await App.contracts.BtuTokenArtifact.deployed();
        if(App.TransferListener == null) {
            App.TransferListener = BtuTokenInstance
                .Transfer({fromBlock: '0'})
                .on("data", event => {
                    $('#' + event.id).remove();
                    $("#events").append('<li class="list-group-item">' + event.returnValues.from + ' transfer le jetons "' +event.returnValues.value +' BTU" a '+ event.returnValues.to+'</li>');


                })
                .on("error", error => {
                    console.error(error);
                });
        }

        
    },

    stopListeningToEvents: async () => {
      console.log("stopListenToEvents demende===========================>");

        if(App.TransferListener != null) {
            console.log("unsubscribe from sell events");
            await App.TransferListener.removeAllListeners();
            App.TransferListener = null;
        }

        $('#events')[0].className = "list-group-collapse";

       
    },

    readNewLine: () => {
       
       var lines = $('#demo').val().split('\n');
       let list = []
       if(lines.length >2) {
         $('#btnSend').show();
         for (let i=0;i<lines.length;i++){
           list.push(lines[i].split(','));
           if (!window.web3.utils.isAddress(list[i][0])) {
             console.log("line: "+i+ "is not adress")
            $('#eroreDiv').append(
              `<span>Line ${i} - <strong style="color:red;">${list[i][0]} </strong> is not Address</span><br/>`
            ) 
           }
           if(list[i].length !== 2){

            $('#eroreDiv').append(
              `<span>Line ${i} - <strong style="color:red;">nombre de varible incorect </strong> plese verifier si vous entrez l'address el la balance corectment</span><br/>`
            )
           }
         }
         //<div class="line-nums"><span>1</span></div>
       }else {
        $('#btnSend').hide();
        $('#eroreDiv').append(
          `<span><strong style="color:red;">plese entre au moin 2 Adress Avec balances</strong></span><br/>`
        )

       }
  
      

    },
    readTextArray: () =>{
      var lines = $('#demo').val().split('\n');
       let list = []
       let el = {}
       let addresses = [];
       for (let i=0;i<lines.length;i++){
        list.push(lines[i].split(','));}
        let jAddress = [];
                list.forEach((account, index) => {

                    
                    let el = {};
                    Object.defineProperty(el, account[0], {
                        value: account[1],
                        writable: true,
                        configurable: true,
                        enumerable: true,
                      });
                      jAddress.push(el)
                      
                    console.log("----------->accountIndex", jAddress)
                })

        App.tokenStore.jsonAddresses = jAddress;
    $('.jsonAddressesLength').text(App.tokenStore.jsonAddresses.length)
            App.getTotalNumberTx();
            App.parseAddresses();
            if (jAddress.length > 0) {
                //console.log(data, dataObjet)
              swal(
                'Success',
                'Imported -' + jAddress.length + ' <b style="color:green;">- rows successfully!</b> ',
                'success'
            )
        

            } else {
                swal(
                    'Warning!',
                    'Nu <b style="color:coral;">data</b> to import!',
                    'warning'
                )
            }

    },

    onCsvChange: async (value) => {
        
        return new Promise((res, rej) => {
           // console.log("OnCsvChange",value);
          let addresses = [];
        csv({ 
            noheader: true,
         })
            .fromString(value)
            .on('csv', (csvd) => {
                console.log(csvd);
              let el = {};
              if (csvd.length === 2) {
                Object.defineProperty(el, csvd[0], {
                  value: csvd[1],
                  writable: true,
                  configurable: true,
                  enumerable: true,
                });
                addresses.push(el)
                console.log("addre:" +addresses)
              }
              App.tokenStore.jsonAddresses= addresses;
              console.log(App.tokenStore)
            })
            .on('end', () => {
              try {
                console.log('csv is done')
                App.parseCompleted = true;
                App.tokenStore.jsonAddresses= addresses;
                res(addresses);
                console.log(App.tokenStore)
              } catch (e) {
                console.error(e)
                rej(e);
                swal({
                  content: "Your CSV is invalid",
                  icon: "error",
                })
              }
            })
        })
        
      },

    inStep2: () => {

        if(App.tokenStore.dublicates.length > 0){

            swal(
                `There were duplicated eth addresses in your list.`,
                `${JSON.stringify(App.tokenStore.dublicates.slice(), null, '\n')}.\n Multisender already combined the balances for those addreses. Please make sure it did the calculation correctly.`,
                "warning"
            )
            return true;
          }
          return false;
        },

    

    inStep3: () => {
        if (new BigNumber(App.tokenStore.totalBalance).gt(new BigNumber(App.tokenStore.defAccTokenBalance))){
            console.error('Your balance is more than total to send')
            swal(
                'Error!: Insufficient token balance',
                `You don´t have enough tokens to send to all addresses.\n <b style="color:red;">Amount needed: ${App.tokenStore.totalBalance} ${App.tokenStore.tokenSymbol}</b> `,
                'error'
            )
            
            return 1
          }else if( new BigNumber(App.tokenStore.totalCostInEth).gt(new BigNumber(App.tokenStore.ethBalance))){
            console.error('please fund you account in ')
            swal(
               "Error!: Insufficient ETH balance",
               `You don t have enough ETH to send to all addresses. Amount needed: ${App.tokenStore.totalCostInEth} ETH`,
               "error",
            )
            return 1
          }else {
              return 3
          }
          

      },
    inStep4: async () => {
      await App.getAllowance();
      
      let totalNumberOftx;
      let status;
      const setStatus = (totalNumberOftx) => {
        if(App.txStore.txs.length === totalNumberOftx){
          status =  "Transactions were sent out. Now wait until all transactions are mined."
        } else {
          const txCount = totalNumberOftx - App.txStore.txs.length
          status = `Please wait...until you sign ${txCount} transactions in Metamask \n
          MultiSender Approval to spend ${App.tokenStore.totalBalance} ${App.tokenStore.tokenSymbol}
          `
        }
        $('.status').text(status)

      }

      if(new BigNumber(App.tokenStore.totalBalance).gt(new BigNumber(App.tokenStore.allowance))){
        totalNumberOftx = Number(App.totalNumberTx) + 1;
       await App._approve();
       setStatus(totalNumberOftx);
        return 4
      }else {
        totalNumberOftx = Number(App.totalNumberTx)
        setStatus(totalNumberOftx);
       
        App.instep5();
        return 5
      }  
      
      
        
    }, 
    instep5: () => {
      console.log("step5")

      let totalNumberOftx;
      let status;
      const setStatus = (totalNumberOftx) => {
        if(App.txStore.txs.length === totalNumberOftx){
          status =  "Transactions were sent out. Now wait until all transactions are mined."
        } else {
          const txCount = totalNumberOftx - App.txStore.txs.length
          status = `Please wait...until you sign ${txCount} transactions in Metamask \n
          MultiSender send to ${App.tokenStore.addresses_to_send.length} Address <br/> total balance: ${App.tokenStore.totalBalance} ${App.tokenStore.tokenSymbol}
          `
        }
        $('.multiStatus').text(status)

      }

      if(new BigNumber(App.tokenStore.totalBalance).gt(new BigNumber(App.tokenStore.allowance))){
        totalNumberOftx = Number(App.totalNumberTx) + 1;
        setStatus(totalNumberOftx);
        return 4
      }else {
        App.doSend();
        totalNumberOftx = Number(App.totalNumberTx)
        setStatus(totalNumberOftx);
        return 5
      }  
      

    },

    onFileUpdate: () => {

          // The event listener for the file upload
    document.getElementById('txtFileUpload').addEventListener('change', upload, false);

    // Method that checks that the browser supports the HTML5 File API
    function browserSupportFileUpload() {
        var isCompatible = false;
        if (window.File && window.FileReader && window.FileList && window.Blob) {
        isCompatible = true;
        }
        return isCompatible;
    }

    // Method that reads and processes the selected file
    function upload(evt) {
    if (!browserSupportFileUpload()) {

        swal(
            'Info!',
            ' <b style="color:cornflowerblue;">The File APIs are not fully supported in this browser!</b> ',
            'info'
        )
    
        
        } else {
            var data = null;
            var file = evt.target.files[0];
            var reader = new FileReader();
            reader.readAsText(file);
            reader.onload = function(event) {
                var csvData = event.target.result;
                data = $.csv.toArrays(csvData);
                console.log(data)
                let jAddress = [];
                data.forEach((account, index) => {

                    
                    let el = {};
                    Object.defineProperty(el, account[0], {
                        value: account[1],
                        writable: true,
                        configurable: true,
                        enumerable: true,
                      });
                      jAddress.push(el)
                      
                    console.log("----------->accountIndex", jAddress)
                })

        App.tokenStore.jsonAddresses = jAddress;
        $('.jsonAddressesLength').text(App.tokenStore.jsonAddresses.length)
                App.getTotalNumberTx();
                App.parseAddresses();
                if (data && data.length > 0) {
                    //console.log(data, dataObjet)
                  swal(
                    'Success',
                    'Imported -' + data.length + ' <b style="color:green;">- rows successfully!</b> ',
                    'success'
                )
            

                } else {
                    swal(
                        'Warning!',
                        'Nu <b style="color:coral;">data</b> to import!',
                        'warning'
                    )
                }
            };
            reader.onerror = function() {
                alert('Unable to read ' + file.fileName);
                swal(
                    'Error!',
                    'Unable to read <b style="color:red;">'+ file.fileName+'</b> ',
                    'error'
                )
            };
        }
    }
    console.log(App.tokenStore)
    
},





    //store  TokenStore ======================================

    getDecimals: async () => {
        try {
            const BtuTokenInstance = await App.contracts.BtuTokenArtifact.deployed();
            var decimals = await BtuTokenInstance.decimals();
            App.tokenStore.decimals = new BigNumber(decimals).toFormat(0);

          await  App.getMultiplier()
            $('.decimalsInfo').text(App.tokenStore.decimals)

            return App.tokenStore.decimals;
        }
        catch (e) {
            App.tokenStore.errors.push('Cannot get decimals for token contract.\n Please make sure you are on the right network and token address exists')
            console.error('getBalance', e)
        }

    },

    getBalance: async () => {
        try {

            const BtuTokenInstance = await App.contracts.BtuTokenArtifact.deployed();
            const tokenBalance = await BtuTokenInstance.balanceOf(App.account);
            App.tokenStore.defAccTokenBalance = new BigNumber(tokenBalance).div(App.multiplier).toString(10);
            $('#tokenBalance').text("Token balance: " + App.tokenStore.defAccTokenBalance + " BTU")
            $('.defAccTokenBalance').text(App.tokenStore.defAccTokenBalance);
            return App.tokenStore.defAccTokenBalance;
        }
        catch (e) {
            App.tokenStore.errors.push(`${App.account} doesn't have token balance.\n Please make sure you are on the right network and token address exists`)
            console.error('getBalance', e)
        }

    },

    getEthBalance: async () => {
        try {

            const accounts = await window.web3.eth.getAccounts();
            App.account = accounts[0];
            $('#account').text("account: " + App.account);
            const balance = await window.web3.eth.getBalance(accounts[0]);
            App.tokenStore.ethBalance = window.web3.utils.fromWei(balance, "ether")
            $('#accountBalance').text(window.web3.utils.fromWei(balance, "ether") + " ETH");
            $('.ethBalance').text(App.tokenStore.ethBalance);
            return App.tokenStore.ethBalance;

        }
        catch (e) {
            console.error('getEthBalance', e)
        }

    },

    getTokenSymbol: async () => {

        try {

            const BtuTokenInstance = await App.contracts.BtuTokenArtifact.deployed();
            App.tokenStore.tokenSymbol = await BtuTokenInstance.symbol();
            $('.tokenSymbol').text(App.tokenStore.tokenSymbol);
            return App.tokenStore.tokenSymbol
        }
        catch (e) {
            console.error('getTokenSymbol', e)
        }

    },

    getAllowance: async () => {
        try {

            const BtuTokenInstance = await App.contracts.BtuTokenArtifact.deployed();
            const allowance = await BtuTokenInstance.allowance(App.account, App.tokenStore.proxyMultiSenderAddress);
            console.log(new BigNumber(allowance));
            App.tokenStore.allowance = new BigNumber(allowance).div(App.multiplier).toString(10)
            $('.allowance').text(App.tokenStore.allowance);
            console.log(App.tokenStore.allowance)
            return App.tokenStore.allowance
        }
        catch (e) {
            console.error('getAllowance', e)
        }
    },

    getOwner: async () => {
      const MultiSenderInstance = await App.contracts.MultiSenderArtifact.deployed();
      App.owner = await MultiSenderInstance.owner();

      if(App.account == App.owner){
        $('#adminPenal').show();

      }else{
        $('#adminPenal').hide();
      }

      return App.owner
    },

    getCurrentFee: async () => {
        
        try {

            const MultiSenderInstance = await App.contracts.MultiSenderArtifact.deployed();
            const currentFee = await MultiSenderInstance.currentFee(App.account);
            App.tokenStore.currentFee = window.web3.utils.fromWei(currentFee)
            $('.currentFee').text(App.tokenStore.currentFee)
            return App.tokenStore.currentFee

        }
        catch (e) {
            console.error('getCurrentFee', e)
        }


    },

    setupArrayLimit: async () => {
      var value = $('#inArrayLimit').val();
        await App.setArrayLimit(value)

    },
    setArrayLimit: async (value) => {
      let limit = parseInt(value);

      const MultiSenderInstance = await App.contracts.MultiSenderArtifact.deployed();
        const transactionReceipt = await MultiSenderInstance.setArrayLimit(limit,
            {
                from: App.account

            }
        ).on("transactionHash", hash => {
            console.log("transaction hash", hash);

        });
        await App.getArrayLimit();
    },

    getArrayLimit: async () => {
        try {
            const MultiSenderInstance = await App.contracts.MultiSenderArtifact.deployed();
             const arrayLimit = await MultiSenderInstance.arrayLimit();
             App.tokenStore.arrayLimit = new BigNumber(arrayLimit).toString(10);  
             $('.arrayLimit').text(App.tokenStore.arrayLimit)
            return App.tokenStore.arrayLimit;
        }
        catch (e) {
            console.error('GetArrayLimit', e)
        }

    },

    async reset() {
        App.tokenStore.decimals = '';
        App.tokenStore.jsonAddresses = [{ "0x0": "0" }];
        App.tokenStore.tokenAddress = '';
        App.tokenStore.defAccTokenBalance = ''
        App.tokenStore.allowance = ''
        App.tokenStore.currentFee = ''
        App.tokenStore.tokenSymbol = ''
        App.tokenStore.ethBalance = ''
        App.tokenStore.balances_to_send = []
        App.tokenStore.addresses_to_send = []
        App.tokenStore.invalid_addresses = []
        App.tokenStore.filteredAddresses = []
        App.tokenStore.totalBalance = '0'
        App.tokenStore.arrayLimit = 0
        App.tokenStore.errors = []
        App.tokenStore.dublicates = []
    },

    nextStep: () => {
        

$('.form .stages label').click(function() {
	var radioButtons = $('.form input:radio');
	var selectedIndex = radioButtons.index(radioButtons.filter(':checked'));
  selectedIndex = selectedIndex + 1;
  
});

$('#fromBtn').click(function() {
	var radioButtons = $('.form input:radio');
	var selectedIndex = radioButtons.index(radioButtons.filter(':checked'));

	selectedIndex = selectedIndex + 2;

	$('.form input[type="radio"]:nth-of-type(' + selectedIndex + ')').prop('checked', true);

	if (selectedIndex == 6) {
		$('#fromBtn').hide();
    }
    if (selectedIndex == 5) {
      selectedIndex = App.instep5(); 
      $('.form input[type="radio"]:nth-of-type(' + selectedIndex + ')').prop('checked', true);

      }

    if(selectedIndex == 4){
     // console.log(await App.inStep4());
        App.inStep4().then (res => {
          selectedIndex =  res;
          $('.form input[type="radio"]:nth-of-type(' + selectedIndex + ')').prop('checked', true);
        }); 
        
    }
    if (selectedIndex == 3){
        selectedIndex = App.inStep3(); 
        $('.form input[type="radio"]:nth-of-type(' + selectedIndex + ')').prop('checked', true);

    }

    if (selectedIndex == 2){
        App.inStep2();
    }
});

    },

    async parseAddresses() {
        App.tokenStore.addresses_to_send = []
        App.tokenStore.dublicates = []
        App.tokenStore.totalBalance = 0;
        App.tokenStore.invalid_addresses = [];
        App.tokenStore.balances_to_send = [];
        return new Promise((res, rej) => {
            try {
                App.tokenStore.jsonAddresses.forEach((account, index) => {
                    
                    if (Object.keys(account).length === 0) {
                        rej({ message: `There was an error parsing ${JSON.stringify(account)} at line ${index}` })
                    }
                    
                 const address = Object.keys(account)[0].replace(/\s/g, "");
                    console.log(address, window.web3.utils.isAddress(address))
                    if (!window.web3.utils.isAddress(address)) {
                        App.tokenStore.invalid_addresses.push(address);
                    } else {
                        let balance = Object.values(account)[0];
                        App.tokenStore.totalBalance = new BigNumber(balance).plus(App.tokenStore.totalBalance).toString(10)
                        console.log('balance,', balance)
                        balance = App.multiplier.times(balance);
                        const indexAddr = App.tokenStore.addresses_to_send.indexOf(address);
                        console.log(indexAddr)
                        if (indexAddr === -1) {
                            App.tokenStore.addresses_to_send.push(address);
                            App.tokenStore.balances_to_send.push(balance.toString(10))
                        } else {
                            if (App.tokenStore.dublicates.indexOf(address) === -1) {
                                App.tokenStore.dublicates.push(address);
                            }
                            App.tokenStore.balances_to_send[indexAddr] = (new BigNumber(App.tokenStore.balances_to_send[indexAddr]).plus(balance)).toString(10)
                        }
                    }
                })

                App.tokenStore.jsonAddresses = App.tokenStore.addresses_to_send.map((addr, index) => {
                    let obj = {}
                    obj[addr] = (new BigNumber(App.tokenStore.balances_to_send[index]).div(App.multiplier)).toString(10)
                    return obj;
                })
                res(App.tokenStore.jsonAddresses)
                if (App.tokenStore.tokenAddress === "0x000000000000000000000000000000000000bEEF") {
                    App.tokenStore.allowance = App.tokenStore.totalBalance
                }
            } catch (e) {
                rej(e)
            }
            $('.totalBalance').text(App.tokenStore.totalBalance)
            App.getTotalBalanceWithDecimals();
            console.log(App.tokenStore)
        })
       
    },

    
    addf: (a, b) => {
        return new BigNumber(a).plus(new BigNumber(b));
    },

    getMultiplier: async () => {
        const decimals = Number(App.tokenStore.decimals)
        App.multiplier = new BigNumber(10).pow(decimals)

        return App.multiplier;
    },
    getTotalBalanceWithDecimals: () => {
        App.totalBalanceWithDecimals = new BigNumber(App.tokenStore.totalBalance).times(App.multiplier).toString(10)
        return App.totalBalanceWithDecimals; 
    },

    getTotalNumberTx: () => {
        App.totalNumberTx = Math.ceil(App.tokenStore.jsonAddresses.length / App.tokenStore.arrayLimit);
        $('.totalNumberTx').text(App.totalNumberTx)
        App.getTotalCostInEth();
        return App.totalNumberTx
    },

    getTotalCostInEth: () => {
        const standardGasPrice = window.web3.utils.toWei(App.gasPriceStore.selectedGasPrice.toString(), 'gwei');
        const currentFeeInWei = window.web3.utils.toWei(App.tokenStore.currentFee);
        const tx = new BigNumber(standardGasPrice).times(new BigNumber('5000000'))
        const txFeeMiners = tx.times(new BigNumber(App.totalNumberTx))
        const contractFee = new BigNumber(currentFeeInWei).times(App.totalNumberTx);
        App.totalCostInEth = window.web3.utils.fromWei(txFeeMiners.plus(contractFee).toString(10))
        $('.totalCostInEth').text(App.totalCostInEth);
        return App.totalCostInEth
    },

    async getGasPrices() {
        App.gasPriceStore.gasPricePromise = fetch('https://gasprice.poa.network/').then((response) => {
            return response.json()
        }).then((data) => {
            App.gasPriceStore.gasPricesArray.map((v) => {
                v.value = data[v.label]
                v.label = `${v.label}: ${data[v.label]} gwei`
                return v;
            })
            App.gasPriceStore.selectedGasPrice = data.fast;
            App.gasPriceStore.gasPrices = data;
            App.gasPriceStore.loading = false;
            $('#dropdown select').html( $.map(App.gasPriceStore.gasPricesArray, function(i){
                return '<option value="' + i.value + '">'+ i.label + '</option>';
           }).join('') );
           $('.selectedGasPrice').text(App.gasPriceStore.selectedGasPrice)

           $('#dropdown select').on('change', function() {
            App.gasPriceStore.selectedGasPrice = this.value;
            $('.selectedGasPrice').text( App.gasPriceStore.selectedGasPrice );
            App.getstandardInHex();
          });
        }).catch((e) => {
            App.gasPriceStore.loading = true;
            console.error(e)
        })
    },

    getstandardInHex: () => {
        const toWei = window.web3.utils.toWei(App.gasPriceStore.selectedGasPrice.toString(), 'gwei')
        App.gasPriceStore.standardInHex = window.web3.utils.toHex(toWei)
        return App.gasPriceStore.standardInHex
    },

    setSelectedGasPrice(value) {
        App.gasPriceStore.selectedGasPrice = value;
        return App.gasPriceStore.selectedGasPrice
    },


    //======================================================================================================
    setupTokenAddresse: async () => {
        var value = $('#tokenAddress').val();
        await App.setTokenAddress(value)
    },

    setTokenAddress: async (value) => {
        _tokenAddresse = value
        const MultiSenderInstance = await App.contracts.MultiSenderArtifact.deployed();
        const transactionReceipt = await MultiSenderInstance.setTokenAddress(_tokenAddresse,
            {
                from: App.account

            }
        ).on("transactionHash", hash => {
            console.log("transaction hash", hash);

        });
    },

    addressTokenSetUp: async () => {

        const MultiSenderInstance = await App.contracts.MultiSenderArtifact.deployed();
        App.tokenStore.tokenAddress = await MultiSenderInstance.tokenAddress()
        console.log(App.tokenStore.tokenAddress)
        $('#AddressToken').text(App.tokenStore.tokenAddress)
    },

    onchangeDecimals: (e) => {
        var newDecimals = $('#decimalsInpute').val()
        App.tokenStore.decimals = newDecimals;
        App.getMultiplier();
        $('.decimalsInfo').text(App.tokenStore.decimals)

    },
    //=========================================================================

/**
 * Transaction Stor
 */
 txReset: async () => {
    App.txStore.txs = []
    App.txStore.txHashToIndex = {}
    App.txStore.approval = '';
    App.txStore.keepRunning = false;
    clearInterval(App.txStore.interval);
  },


  async doSend(){
      console.log("DoSend")
    App.txStore.keepRunning = true;
    if(new BigNumber(App.tokenStore.totalBalance).gt(new BigNumber(App.tokenStore.allowance))){
       return
    } else {
      App._multisend({slice: App.totalNumberTx, addPerTx: App.tokenStore.arrayLimit})
    }
  },

  transaction: (status) => {
    let classname;
    switch(status){
      case 'mined':
        classname = 'table-td_check-hash_done'
        break;
      case 'error':
        classname = 'table-td_check-hash_error'
        break;
      case 'pending':
        classname = 'table-td_check-hash_wait'
        break;
      default:
        classname = 'table-td_check-hash_wait'
    }
    // const classname = status === 'mined' ? 'table-td_check-hash_done' : 'table-td_check-hash_wait'
    return classname
    
    
  },

  async _approve(){
    console.log("_approve")
    const index = App.totalNumberTx;
    const BtuTokenInstance = await App.contracts.BtuTokenArtifact.deployed()
    console.log(App.tokenStore.proxyMultiSenderAddress,App.totalBalanceWithDecimals)
    
    try{
        return   BtuTokenInstance.approve(
          App.tokenStore.proxyMultiSenderAddress, 
          App.totalBalanceWithDecimals,
          {
          from: App.account, 
          gasPrice: App.gasPriceStore.standardInHex,
          }
          
        ).on('transactionHash', (hash) => {
            console.log(hash)
        App.txStore.approval = hash
        App.txStore.txHashToIndex[hash] = index;
        App.txStore.txs[index] = {status: 'pending', name: `MultiSender Approval to spend ${App.tokenStore.totalBalance} ${App.tokenStore.tokenSymbol}`, hash}
       
        
        let classname = App.transaction(App.txStore.txs[index].status)
        
        let hashLink = ` <h4>Transaction Hash:<br/> <a target="_blank" href="${App.explorerUrl}/tx/${hash}">${hash}</a></h4>`
        let divID = 'div'+hash
        let idDiv = '#'+ divID
        let divHash = `<div id=${divID}></div>`
        let divClasse = `<div id=${hash} class="table-td table-td_check-hash ${classname}"></div>`
        let TxHash = ` TxHash: ${App.txStore.txs[App.txStore.txHashToIndex[hash]].name} <br/> Status: ${App.txStore.txs[App.txStore.txHashToIndex[hash]].status}`
        let s = $('#txHashes')
        s.append(divClasse)
        let idHash = '#'+hash;
        $(idHash).append(hashLink);
        $(idHash).append(divHash);
        $(idDiv).append(TxHash);
        App.getTxStatus(hash,s, "Approval")     
        

      })
      .on('error', (error) => {
        swal("Error!", error.message, 'error')
        console.error(error)
      })
    } catch (e){
      console.error(e)
    }
    

  },

  async _multisend({slice, addPerTx}) {
    console.log("Multisender")
    if(!App.txStore.keepRunning){
      return
    }
    const token_address = App.tokenStore.tokenAddress
    let {addresses_to_send, balances_to_send, proxyMultiSenderAddress, currentFee, totalBalance} =  App.tokenStore;


    const start = (slice - 1) * addPerTx;
    const end = slice * addPerTx;
    addresses_to_send = addresses_to_send.slice(start, end);
    balances_to_send = balances_to_send.slice(start, end);
    const nrTx = addresses_to_send.length;
    //
    let ethValue;
    if(token_address === "0x000000000000000000000000000000000000bEEF"){

      const totalInWei = balances_to_send.reduce((total, num) => {
        return (new BigNumber(total).plus(new BigNumber(num)))
      })
      const totalInEth = window.web3.utils.fromWei(totalInWei.toString())
      ethValue = new BigNumber(currentFee).plus(totalInEth)
    } else {
      ethValue = new BigNumber(currentFee)
    }
    console.log('slice', slice, addresses_to_send[0], balances_to_send[0], addPerTx)
    const MultiSenderInstance = await App.contracts.MultiSenderArtifact.deployed();

    try {
      let gas = await MultiSenderInstance.multisendToken.estimateGas( addresses_to_send, balances_to_send,
      {
          from: App.account,
          value: window.web3.utils.toHex(window.web3.utils.toWei(ethValue.toString())),
          to: proxyMultiSenderAddress
      })
      console.log('gas', gas)
      let tx = MultiSenderInstance.multisendToken(addresses_to_send, balances_to_send,
      {
        from: App.account,
        gasPrice: App.gasPriceStore.standardInHex,
        gas: window.web3.utils.toHex(gas + 150000),
        value: window.web3.utils.toHex(window.web3.utils.toWei(ethValue.toString())),
      })

      .on('transactionHash', (hash) => {
        App.txStore.txHashToIndex[hash] = App.txStore.txs.length

        App.txStore.txs.push({status: 'pending', name: `Sending Batch #${App.txStore.txs.length} ${App.tokenStore.tokenSymbol} <br/>
          From ${addresses_to_send[0]} <br/> To: ${addresses_to_send[addresses_to_send.length-1]}
        `, hash})
        
        let classname = App.transaction(App.txStore.txs[App.txStore.txHashToIndex[hash]].status);
        let hashLink = ` <h4>Transaction Hash:<br/> <a target="_blank" href="${App.explorerUrl}/tx/${hash}">${hash}</a></h4>`
        let divID = 'div'+hash
        let idDiv = '#'+ divID
        let divHash = `<div id=${divID}></div>`
        let divClasse = `<div id=${hash} class="table-td table-td_check-hash ${classname}"></div>`
        let TxHash = ` TxHash:  ${App.txStore.txs[App.txStore.txHashToIndex[hash]].name} <br/> Status: ${App.txStore.txs[App.txStore.txHashToIndex[hash]].status}`
        let s = $('#txHashe')
        s.append(divClasse)        
        let idHash = '#'+hash;
        $(idHash).append(hashLink);
        $(idHash).append(divHash);
        $(idDiv).append(TxHash)   
        console.log(nrTx)  
        App.getTxStatus(hash,s,nrTx)
      })
      .on('error', (error) => {
        swal("Error!", error.message, 'error')
        console.log(error)
      })
      slice--;
      if (slice > 0) {
        App._multisend({slice, addPerTx});
      } else {

      }
    } catch(e){
      console.error(e)
    }
  },

  async getTxReceipt(hash){
    console.log('getTxReceipt')
    try {
      const res = await window.web3.eth.getTransaction(hash);
      return res;
    } catch(e) {
      console.error(e);
    }
  },

  async getTxStatus(hash, s, nrTx) {
    console.log(nrTx)
    console.log('GET TX STATUS', hash)
   /** if(!App.txStore.keepRunning){
        console.log("KeepRunning")
      return
    }*/
    setTimeout(() => {
      window.web3.eth.getTransactionReceipt(hash, (error, res) => {
          console.log(res)
        if(res && res.blockNumber){
          if(res.status === true){
            const index = App.txStore.txHashToIndex[hash]
            App.txStore.txs[index].status = `mined`
            console.log("before:",App.gasUsed);
            App.gasUsed = App.gasUsed + res.gasUsed

            console.log("After :",App.gasUsed);
            $('.totalGasUsed').text(App.gasUsed);
          } else {
            const index = App.txStore.txHashToIndex[hash]
            App.txStore.txs[index].status = `error`
            App.txStore.txs[index].name = `Mined but with errors. Perhaps out of gas`

          }
          let avrg;
          console.log(nrTx)
          if(nrTx =="Approval"){
            
            avrg = res.gasUsed

          }else{
            avrg = res.gasUsed/(nrTx);
          }
          let linkHash = ` <a target="_blank" href="${App.explorerUrl}/tx/${hash}">${hash}</a>`
          $("#gasUsed").append(`<tr><th>${linkHash}</th><th>${nrTx}</th><th>${res.gasUsed}</th><th>${avrg}</th></tr>`)
            

        let classname = App.transaction(App.txStore.txs[App.txStore.txHashToIndex[hash]].status);
        let hashLink = ` <h4>Transaction Hash:<br/><a target="_blank" href="${App.explorerUrl}/tx/${hash}">${hash}</a></h4>`
        let divID = 'div'+hash
        let idDiv = '#'+ divID
        let divHash = `<div id=${divID}></div>`
        let divClasse = `<div id=${hash} class="table-td table-td_check-hash ${classname}"></div>`
        let TxHash = `TxHash: ${App.txStore.txs[App.txStore.txHashToIndex[hash]].name} <br/> Status: ${App.txStore.txs[App.txStore.txHashToIndex[hash]].status}`
        s.empty();
        s.append(divClasse)        
        let idHash = '#'+hash;
        $(idHash).append(hashLink);
        $(idHash).append(divHash);
        $(idDiv).append(TxHash)
        } else {
          App.getTxStatus(hash,s,nrTx)
        }
      })
    }, 3000)
  },
/** */

netWorkInfo: async (netId) => {
    netId = netId.toString();
    let res = {};
    switch (netId) {
        
        case "1":
          res.netIdName = 'Foundation'
          res.trustApiName = 'api'
          res.explorerUrl = 'https://etherscan.io'
          console.log('C´est la Foundation', netId)
          break;
        case "3":
          res.netIdName = 'Ropsten'
          res.trustApiName = 'ropsten'
          res.explorerUrl = 'https://ropsten.etherscan.io'
          console.log('C´est la Ropsten', netId)
          break;
        case "4":
          res.netIdName = 'Rinkeby'
          res.trustApiName = 'rinkeby'
          res.explorerUrl = 'https://rinkeby.etherscan.io'
          console.log('C´est la Rinkeby', netId)
          break;
        case "42":
          res.netIdName = 'Kovan'
          res.trustApiName = 'kovan'
          res.explorerUrl = 'https://kovan.etherscan.io'
          console.log('C´est la Kovan', netId)
          break;
        case "99":
          res.netIdName = 'POA Core'
          res.trustApiName = 'poa'
          res.explorerUrl = 'https://poaexplorer.com'
          console.log('C´est la Core', netId)
          break;
        case "77":
          res.netIdName = 'POA Sokol'
          res.trustApiName = 'https://trust-sokol.herokuapp.com'
          res.explorerUrl = 'https://sokol.poaexplorer.com'
          console.log('C´est la Sokol', netId)
          break;
        default:
          res.netIdName = 'Unknown'
          res.explorerUrl ='Unknown'
          console.log('Il s´agit d´un réseau inconnu.', netId)
      }
return res
},
/**
 * ===========================================================================
 * get address with balance for tes
 */
    getAddresses: async (nrAddr) => {
        var addrs = [
            "0x844c6733314f878adb6a8d2f8133f04735945cbe", "240d75ec3bf0a4a7996499dd1416de89f5c0d77186aff282b5a65ba820cfbd58",
            "0x9c313628a2632c8b4109c11e2ff8b45c1a3d5ee3", "d4cbcf2981481d26f0b00cce52f421c34079e0a24a2a6a3b010b61bb4a44b0fc",
            "0x7a1813a9c99f9ccfc953465d9fec61c8d6b2c11c", "28b32a02e7a27d562c0d3aa48ba532f0c10594e7f3d47cfe90af89305be937d4",
            "0x3285ff9e3cd9ee2c62c8c7f45e271b4b63ddce2b", "cfb1a81aeff75c698078904c6ef672b3d711bdc9df479d734c1db3c2fe38ce4c",
            "0x9f456d76071ebfc809efd91fc77bc260d85708d0", "2951b86ad48f971ff158f863e6a0e7ab79d2e98d2468fe30888f3aa6b733322b",
            "0xcecb4ff497ff0aae9e5e5cfc9e57c3446a63e61f", "5f13b80afa0066b98e261ba9ff477cc431a0fd083b074caf871d15f57cbb95e2",
            "0x201a2b88796d94d6a95bd4b9dd854b854e8cff06", "2586d31cb3c6a7e77c77a6ac5a27d5de72252b3c8432db8b661030f72d654256",
            "0xe5c1bf29fb266207741b9969d1366009e519d2ed", "7f78ef09f8d11b9f1e4576c875549a2ac75baa8f0cb7ae7cf469b9dd72968f88",
            "0xd2d8be9a3c5868d50c3c31989af42135a909f41f", "0df8a13a5ad737120d092b42e07ef865c1fd879434d1c285cb807035289175e3",
            "0xc41d0cee94e63b1a1606eec4c5936b1d060177a2", "e2306520457088597573f0f8242af49543fe4832a61126414c3eeaba4e00a344",
            "0x8b336ed807fa61d74e02b0462cf3244a17dc22eb", "7ea6a685d2efe0f7225b6a96e2c0e81b061eaa797763ac9a4d1397417802374a",
            "0x9310894f7dda4f8cf2f38c020c41ddcc9979ff1f", "073cbfa5bf55661be0d92b3c136d6e273b21e9844e88adb824a8c5ea9b64e4a1",
            "0xbcf6db950b878700db68b887a6f7e7aeddf686c4", "b46ea59a307b802ba48fb02f1b6c5b65e01a204a5cc125efc09b6928daff9156",
            "0x94200941b4c83e80561dd9f98cfe9dcf692d82cf", "e089dbf3b235e602f33d490764ed9850e40eb910028a4fe14f49093619dad097",
            "0x96df4bdbd119ef5511b5b2ccf29581acee291f96", "fcc71fff6efb58c9b416eb4dcf5011e6b102e62c2269db4eace972d6dede605b",
            "0xd670145e379aea7558f91893732ead9e03dc1a68", "e2ceb30e0ef6e0d9b45d8b5feaadd81a7eb5d7bde2365b324b309d1210e827e3",
            "0x01b27ce8f7c534e4d76057c05aa1e15c1930e1b8", "83f954990fc691e5d00c7c020bd4f42fbdaab37b6917ce7251aca19e7204a90e",
            "0x2dc8e047831abe93a9032582155e9b0b848e1c69", "6e0d0a040e91ea9df0c74744b28214a131462bee46dcc2e330aead1c4fb61066",
            "0x198727ff9c82c4287727eb7349f543e6ad1128c4", "6386b88626ea3f828ccdc62b13b3d6aa5d30cb52c2c125be8e80329444e9d847",
            "0x4ae147c0e6f52ca74aa14f9e99966c306e379401", "b55b9546efbe549a49c4c6493b60f4f69cfd258211f1ad2424888e01ff69093f",
            "0x2efd8a34524f0ff5049c04daedb8c8fba2479a3a", "7f9b382506deb1a1a8c12bdecb2d9a8b40f61d2ec9e9eb0604369233ff97cded",
            "0xa675afbc573194dab23bcf055d80a2838852aebc", "3798344f1207b77566ffda7881e3c61c0f4e4557eda41118e3785859f0e741ec",
            "0x488a3cf036bb9caf635aefa655a9b4d74d848f9a", "dc925b0d3f7bf25edff5ac42b00d85174e336e254591b768a2eafc4674564d67",
            "0xc015f254de83ad93a73ea50ea79fddbeaacba0b1", "39c81b8140fd84dcd14d7c6743b1b4fa78188c3d8bf282d99908e63f103df6b4",
            "0x3309d29bba98c4e7a60b8cfb383a1e69ac7c66aa", "8802ccda020f02711c93dd96a6a19a17fa8247127deb26ce0ce98c205cdc032a",
            "0x7996ca9b9616a5def2784f4618fa0eb2bc310883", "687ae47722cbe8294adf2e0a6d8266c39e7eb804803cb4fff879a4e9e97b58bb",
            "0x9cc6ad8407d156233fc8235fdc3b7e0489b974b4", "8c4ed626c0949cba7b5b7b0ff7e8e080219bbd4e99d638fbc40281c31fa86a75",
            "0xdc88617443bd8b44a27365bdcc4e9a4e5ccdff44", "50afbf9cf83990e2bbf01acebff2e55dd4ac1e4d59130d7ae6d92b44d8ee6a3f",
            "0xa816f8618c42fe9097c5dd453fe60f8ebaae699c", "9840af9d44b5741fe6639ae9eb1252372b6a4aa95180fb36ca0ba29c75c0ce86",
            "0x4bd8209b0d72afb390d10c8cb62643a597d6a694", "609fddb97870f3e03a1cab352932801ceb1d801c2066897ada72cb6af80848e0",
            "0xcea385f392ae6fd7ebb78d86b5bf08243d93d4ff", "99f263645c6d0a700415e2079fdbf74f3e5527f9ffa167912fa54a1d3da3687a",
            "0x197afaa0cff52636b3724bc4134a4bf6e3ae1e4d", "ebcf0560752f27b3a8a25de88d15aec67540583309659dc9bf5bd47d3feacb78",
            "0x353e88c120551297f9794d7e728018888f5b95ad", "7ac995332f9fc4c41cae358efdff1f7065d77780bb61b4cc82fe68f28eabbf5f",
            "0x493d447c3a9399e1a03eac48a76de012e99aeda5", "7f1f1854222bd15a5b0c7d84031f8f30df138da7abf3475dd9d864b258989327",
            "0x25fbc201308504bdbd86da29e2a74afb71d580f5", "dd45ff2a9d7c849c3eb61f077434dbf418c6c73f880e50c8f8c5396f86855f65",
            "0xad9f1648362feaa2f3b4f79a9de5258ce2524ef3", "a1f1c8e1d50f7f989e77c654b964a2aef4ab8d06b9c81448fdb148b7c7d7b410",
            "0xe46b7d897e97d87c4895ed1b567041d6f275a50f", "b81ead25ea17d9bf3281a928853306a3d0726ad263b8b60c719581c211632613",
            "0xbd188305eeab0998b130b40f9e4cad728b45216b", "80b9a098486e54713f27049d7c88ed81bbbe33a3ddad95ce346218e0d40f871b",
            "0xfb746490169d043b40bce68d56dc217f87095b34", "7837f2685b87d3d4b31808124f57982844bd652fcc4d06d24d96a5a6cb5bd58d",
            "0x14baf1deb103b1afa6690b3d03a3a695ca8e9e92", "91fe2b63128a329248e83935b1d27f85f2e1f691ac58e154bfe553e80b3e8121",
            "0x0f832389d9ca122f459454659b4356cc08b86141", "5aa238332c9ea173f05085731fba5608027b5fd6d15217ab00a2c7e6ec61d8ab",
            "0x73b001fcc32b54b07d812a245f1597fb4256577a", "139273041398f1eb50ca2189fd50c184d5a9a2ff28bd10338e6b14898022e946",
            "0x1624283d16c392d9540e03402c492cbedaa30073", "b13d349a3455d8fc10d3903f9abcf3887da0dea1d277a35e4fb76f83c0d42778",
            "0x89f950ab3bfa48ebb3a236649b8be20274debcf0", "a28a9577f050b660c1a0a37d097c0ba7da62ef8b44fc8b58044762cbc572326c",
            "0x0b6e50eae684998ce1c7193f977b70c1353a916d", "c25b9371c7d627299749532ee2033093f0a8f25662283104d8b63a8e685b9869",
            "0x5a8ed29967fdc9cf6ad01336328d8545884766f3", "b2058e4b2254fcaaff478c7ccfd485a10be61f40f1e7077de0bfc5308b3350b6",
            "0x21892d549c1394a49d084ae7c4f194d275f1dcb0", "81b49366dba7568b6dc0b3bd7e8c93d1ad8f36f738436859016c4058320fefbc",
            "0x8d942a917c4f23a7c4be189e8ab4dca74fb1d30b", "92c965018a237e9f7b90d561df86f3ee348d4b620a1f25480da701a559c85573",
            "0xc685b0cff293328954b9b8a3e0a7bffd01f299af", "f46fd96d69b9305a602f2d2759cca1c7d8d768f5abd5faf3753064b4473b8576",
            "0xd831dc14ea58872f53d0628f4e39ed880c0a4cba", "5c5b7cd7596e020ed3e51046d856c07b301a393448a8bc84ca74cf02d31cb6a4",
            "0x11d1998b1823701a14d8218cee6d4160be9b6b72", "3f31b29bcea3ebaeaa144af08f70862dffdae129a9b9de0a93e3beaf1ce12541",
            "0xb47d3d5a2c1e9d06029521a7c000c532542eebec", "278fb2347291a4e659ba263d423fc816f91f1244a2967b7e45fddeb0b69bc139",
            "0x984a631a9590ab198f915356b59edafb7c0b4cd3", "4bc3472b716e922472e118bb7ed585052bb724a56a5364d292cb4c446b738cef",
            "0xa347ec1961f55bb2c30ffff8ce27c7c7b68613d8", "804019f837c4238674a89123be277fc736c637ec9163dac53c909a2ae9c8ced2",
            "0xb1181e70a79262aefd6b2a6b0bdf6c9fa31eba23", "e95aa4032d9f280c798a38ce28bef9786d1c6eecf05d337c728cd42893c1dbf4",
            "0xf813786dbc5eea832249c5d353bc4d11dd1620b9", "9d1dff618927d42c779d50682b5ef8efa6c63ae2939ed3ca81fbab8992e7927e",
            "0x010af94e950039b4e6b4430bb9721367885ae784", "a823485415c78c6a39eab5806e7c1b63adbdc1a858ea8b6967e75846599d0e0b",
            "0x38db131177f31769a35ec935ef1a8a697caefaa3", "f42e7ad1fd48019d1df76b7e1c18c7437f57b0bc898e3c276f10ebfd281a05e5",
            "0x0016c7435d221ad787032921a5620427f5ef97b4", "40e69bd805c15344e7d1f93296e7cb6d02974e69ee0a1addc285531eb69b6d97",
            "0xca42f7a90e4e90bb21c61d9cd47d9fc7c30f2e08", "e3bf997d9579a31b29618701919fc85cb034b9ad8cb80df69bb10409006b0461",
            "0xd17b82bf76eb61e72a7932f71968240d2cb5b864", "ac8fddd7a6bdf707e57addbc7b1c22e2451ea99c323eef604172c21b094f81e8",
            "0xf5bb779b793ca97a6755e49964c47574d720cbb3", "56b95f6072c8346715d3dc85f2744ceeabe4a52adbdc69ffc1ae76aaa8263924",
            "0xff350f2d26ef099ffc1db6a839078b2b4fcebc88", "9827d37e3b6216300d308b895993f32d8b1869b0781b3656058d3ddefdfe88a4",
            "0xdae084130384e2b3a011076120c6667aebb09ede", "b894fe154f15d31c86129cf22d9e929094fb5f42c3865fbd463a50d9ca6da110",
            "0xf366df51878568a94d80a38ceff8b79ce0fa10e7", "a7187f974e75a8b9744e7427125e7b3ca496a9c3d30240004058f33ef8ba169f",
            "0x74df0b7f58e7a789b91d4ab607606a6f7c6a488c", "54cda67dc8f0bffee981b1ff54d643a34f8a463ef23b165b891f2252435a9330",
            "0xad5b35ed09a538f62d7ef45b6bb2123c6762bfe7", "beb9a0fdf5ef41390c0bdce7aa4eb02750c06f814a3b499209126fa48e7bb1d1",
            "0x5b73d96abceeb1be4c2c95bfeacf2a8acb1b3e75", "9054c356bf5f14a4152566d8a1a042cd0dc638f2eb8108612ca37be8d2abf367",
            "0x7077caf2965c0ad432d94b00a86b2a97b218de98", "0c94f33d2df1fe03a5911222549ea48b4581c4081dbd93c86b5fa7cc983f6c2d",
            "0x42ac60e9d7c7cd184c8c4eea0316aad4de2b798b", "fc3b1e1c168ac4838a2186520a61179f91125a353d5b158ab98ab6d11d53c730",
            "0x0994060884ed590f964b49026e9bc7ab473f4b67", "63eeb8a99e6b581c4de09abe2d2bfc45f1c7816c86d23957434c7a408491f069",
            "0xeea99eb9681c2f80fc8b71017681dd44021baca5", "a07d37e856a18dc2aa130980b8d94e493e7ae2a19b1c9b0b2d52c11b5baccbcf",
            "0x6ca9f2207d38998561de64a7e45fbf81c8e1a9d4", "91368bd470dc04f25f824b92f96aef130dbde12ae0fb8e68310bfc37b8a23bad",
            "0x45b02b91674dd918a57a657a803cbbf14b297930", "3cedec6366994e0e63529224e99f4b656a20aa901ecf84262b54424167d7fd82",
            "0x699b2d6d37e84433e732d8a225e9995a5a305982", "8a191540a2be5fb1d9529b23da815a71424f6208f67d6bd46eeb7adc37ac8937",
            "0xd6d55bd30f3fb3ddd17189524dbbdc193b9ec33b", "7aa6f86e1aebe222a70b5183dd983dd04ac656b346b585a0e15e3e953af51431",
            "0x56b47160f313c5ef410149abbbe897b8af43d91b", "88eeedbae71f1d487cde10e559794cd1d89de31d87daa4470afcad356cfb3655",
            "0x7f8b345fafbcce71b49b296d43cf5681e25fd883", "46b39e9105f72483f300b2c23aa7e07681dd60e3d8cb5748cfcb368727f184bc",
            "0xbdc9ffad805505932780ddeeaa2cf4285d239817", "a62f93142b9822f3928d1fa5414328c4e970128f9264782db00d05e83bbdc931",
            "0x22c9abd5a9f85c020e0f34f2ffbcd53e22ed6f69", "f0461920f308732ccc79f0172ffed2c917af1dfabaebd4995d8987f1caaf4226",
            "0x3348cf958ba4cf267d229e9103e6e7d2d974918d", "2b996f68c24e4bff2cf0d8a399c8c46211700d4119916e6fbf15654b1a4a374d",
            "0xc98e2d61cb03c311abed02b76c1da6d1d44a250b", "df41f9469930b36d7fca05fbd9d3b17c1c527d6542ebefb7de1e4dffc329a7ad",
            "0x2952361d68440e10f3fc0892dbe8db94d6e45e9d", "c1972b3d14fbf75bef5c3b8456b5d22df5c2e3347aeedc4f0af0efb727a9e8d1",
            "0xba302d88c3fdd4be9b1f218da3752098798c2e59", "ea4f9b7bc7167d8d5d7a327730f6a4b3703c79014f7249b88c7e72bdcad52fae",
            "0x8364613d634a5a859a2bdd6e8bfd02b3d0db8232", "6050cc4e1da127b41d53f4c72c401d05c0fa35d03b10780c23c006812c919e4a",
            "0xe27336090f66893dced2ad1213b2cf003a7817c4", "1e026d2bdd2fcf28ce8dd43367678efc8e31f15cc5da874d173f06c369cdcb7d",
            "0x6f82f5987d6f947a47543f3fa80e67f9dc76a94a", "e0fe9d3348b7d2b5eb39631c73a3fdad2fbc13e0897b9462fd50551f27316d4e",
            "0xae53980b7145b244bf4f47766306e6f5ebdf90f3", "49b186ec2f9f135bd37520c922a82de2914105cebf6f795abb7c9e428091b00e",
            "0xd653cc7e7b4c8be0bde7ac98e8068dcc5bea9fca", "895752af6a2924b3f99f1fde23f5501b63548e56161fb9f6063285aecccd5ab3",
            "0x2d98089da3eb1be7a59f74c4fe453b559334f026", "6340eef6a157af32e586ff4e299487d728f27c6ff216e3f81c42171d14ca0252",
            "0xa06a0101428bae5564b27df55159a96b9e86a7a5", "1fdbe37518301045589db2697f6fdad3e6d57fb772c522c215b85965281904c2",
            "0x5e35386dbfede8c77c06f11aa155276361f283ff", "78c69235e1451a7484c7e7e29560dc85f8becb1dca5d3949ae79aebeb0f05fdd",
            "0x2d9d43cc70b28101f3e7fa2236a685516fe2b2c2", "f788763b60aa29dccb9206615aa776f29fa3d15ec81bc7884535600a470e0e72",
            "0x1f1c117b29a9a5bb947559feabd9a8509d29531e", "aa86f918d973b1762663dfcbec49c737b88146915a5b25ba8147150c69b6d041",
            "0x1d492bc4d9b7bef71444788adc6926a413372640", "1f0bbd8e092972ee84f772dc9f0ae20ec8cc39a443ddbf897665a9823f8e45de",
            "0x8948607d5e5cb9600d568ec0e7062ef9502f3d44", "be81b6ee56c85d4fda3a046878c906c915d0a53c26589be8785dbdef88e9f516",
            "0x12af4d0b8db56e6d7aa16f465d7cde1e63a3284a", "4fd6fbe07f57bd4640a640777b1603f7e766e5ecbbf8ddbf77ce4c822c998b34",
            "0x5b584050963192da89805320e9e69ac3d2e743df", "b3ec95c011649f7b0fdfc92f6176524cfb6f69f7d72efdbcf133df7dae2d4e90",
            "0x5be0f759bfe1ab41a5fa4c56c2a6a29b7abfc773", "5b07b1442f21e4f507d73bd6b58e23df344ef59c337e57fac9a0ff0358614ae2",
            "0xae7ba800e7df61804aba6f728e1084acea303605", "e392fcda6f47cf09ddfd3ef69ec182c97ac6819597d51de3926e4e4d9b32138c",
            "0x843d2e8cb83772e72f6f98208883d4e349b8822a", "52d34998812c7125685ca140ee6f885f7bccbd31b1bdfb17bfe7c7850ce54e85",
            "0x0f221cf6c2a666b7ad5578b7779c065056b3dcd3", "627c5f9cf539264ecab9c3885372611ec8a2b70b7fc38ce2eb0020dc7e287821",
            "0x67323c5571f5582e7faf7afff11f1d4aa34d3555", "919f944f138f0773d277c2329b05ec681a4c96a287e8bb444f001fced57ff48d",
            "0x02398cb32f60fd69aa8d33cd7432a270c35f61ae", "971435bc7a5bf2ce9f731b9257ac3a968f18c05dcbdfdf31d4d1b2c88d19a8c0",
            "0x6b64b2b61edb618d68ca0edc8c944347ff0ef99c", "0aa6799ccf9bd8c3811aabef8f9cfcad37d738e5c8d448e1b3d54a375e9030ae",
            "0x2f95c7c27b188243a99fee280a29bc74163c151f", "e2c6e71a7bfe6cf442bcf0e49c1b99bf1b770a65691511f446729e4d9e096f6c",
            "0xff313865dc5b154ae02106620c3c83eb5b9695d1", "bd2315132a62d869f2e4b036a89fda8556d0aacbfd22627b921525818752fcf0",
            "0x9b8d8f32bfa1620a88d90f1031bf2cfca38f1f29", "798c35feb60172fbc07028026d6ea5d3f783f6d3319d16b74f8ed29add933514",
            "0xf1bc2b34e765a21b098a992c6eb2d3aa74b1e693", "007224e9c86d661e09f148d56494e736b8c7024b3f221a38c2d5402acb6ebdbc",
            "0xf90b139b37c27e0542f95fbb7d3215345b3ac9f7", "87d057a6d9ae53c322aee4d12fd049ea964588fa374ed6597417442236d96b9f",
            "0x8e8036000c53f9dd509bca19b529989f279c6be0", "d5cb08f963a5c552b88edc07a9f34027aade5c9a53c117a7292e31698dbac580",
            "0x0342559d85bf1211a1f1dc633f8158c303b01ded", "f1a2204d7542e0f8988ca7788cae85600e4436ebc8bf5996305d4e1e4cc6a815",
            "0x3eb20e953b4dbe42be96c5e685d35c3566cf4c82", "a7f7cdde7948a8fc1e208c11cab926a2fe0ab0466dbe455b43ecd3987e58c2e2",
            "0x7bb5fd5f8b0f9fbfc3021d3e674c00986b8d2be6", "0e031aa7930c40625e60665269ed621791f9f748c957b24c31d043ecaf5ba79b",
            "0x814dda7b2ee03820e9813054a96b53ce384cca05", "a4f35501e22b907299e7a8ca7df6406a3d605c329f5292e124b0b14f80833945",
            "0x2c24890bdae261a71e5e700eef356b8ec0811b4f", "0d80609d2e001ba330098959f3fc0218c237c76dafb11a30778f3ccfd2e63520",
            "0x4a89de4068b25f5bcb02d15fa742f36332572bdf", "90596a0908cb2274da673c64baf2b7cd5948540dc39dd24db0e5f31a48c2ad42",
            "0x0368b303a4f21734ee40837088e2b8b92f48d39b", "4eb3ee93f7c00b6c99046eea88af04d58520d46c457695234015073e4815a090",
            "0x1dfabb512aadb258d7df39d36e3c24f69af75af0", "7bcc46bd22e3d1f7840b8d1f3dfe8a24e3df91abee1255e782e51de5144eb545",
            "0x3f52b02067ebc200253e8e8b8ed2141812b5bc35", "dcf06ccad8f74f1823608d390574f2240ae040a2e120a76e72a3130158d5d39b",
            "0xa2379b5bd19723c76d8a0972fd678d0d2b2b238d", "ae298aa40b057f7a7dc94cb07a4a92eaf9764726c428757e9d78b8039588814b",
            "0x2e158a37803880291d0c00873782a135d6b681f6", "9715804f03a8abbfd3f8580702f299d5c65c9c40a0d6f23b010505d240053ada",
            "0xc0b906919d1c43c59a492a75bbe021c7831f413b", "8c3ab14f75434ddec8e533ee7739172eb7e78b15ce2ac505929646e0c200f562",
            "0x1e85a2cca90d043df4bdef71d9bed32e9ec7a3c2", "3c69243d85090686ad1bc10ee42b108b8b11dfdf70e8ad5c8bbf1be5154f03c7",
            "0x9e7ee173bf525a8e3a2e57ab484615abc84d0d09", "00e832496ce0fa458c3fd7c6f31c609cbe5b2bc220e31f8be8dd2bd5278704e5",
            "0x811299b31c1a4aa8ecd3187aefa0fa5559ab749c", "34dd1ca59b9e274035c1072e71069fa2bfbf8cc97ba3c54550020a7d6e0c0a6f",
            "0x52927f864dcc6f1c300dbc5d76f434fe52e966ca", "2ebb5357fb110707040ca2ea781467def720134013242d9d3c10d91ab747ccba",
            "0xc2ef365a766f970c84846a3b53938c805b93fa82", "2d57877653eee862fe23d8431186aba188577095ce4c5fea39ae97d982a931a7",
            "0xe88ff10a499d0b270c268956b969f3b44dbc63eb", "701d5b1078b96805005f1c8441194ca710942046b07744f3b627f6dcd921e7fb",
            "0x63598bb5da9ff0f4ff3a68ae56e7daab0756cbe5", "c990e1638e057d333bbc08d33e0c24a66656fe9733a093a18ef76e584e7df24b",
            "0xf96c3bb05c8358f24f6a15a6f2b44d1416fd903d", "1dec4cc6fc7f8f17e3fee90d1c589b31b88b83caaed3b2da71e412395b68ac51",
            "0x471761f81f3aeabfd3e215934d3c45afe3f4147d", "0de04dc461af277f85db99f6b6bce1bb5ad0f604d6c42d469ceec8974068528e",
            "0xf229cf97e43b241d3d52979902027871a8c3915b", "0b726830a7ef141ca7b8a285e1ee9199e04f85a1c1c9a1d3555a6f0a4068e7d6",
            "0x644132994c345ecb6a169abf99beecc89b4d27ae", "e1099f85009b2335cb7119b3e67287c5b1a751da4803c02ca29827e9655fa465",
            "0x79e26815a027ebcb5ec8d7eab2b2fcec82267edf", "a83670be7649fa1279c57aa93d94f17b5e7e8da9c5c43161c2bde6f868d41ba9",
            "0x373ea177e2b6a66d6aea8687f1f5a84843500427", "37f6cd759f5356109d1743f9dd8f942f2e6909a81a4d15a6c7531437a428b7c2",
            "0x2f914f3ddd64ae7046cf41b9194b8299f0f70f36", "2a1aae99c2890110edfec24ba942c8f93f2884a097708071e154d2b87f19630f",
            "0x5779b2871a1c34c5be5005009cefbdff3f9f366e", "46eb0e86803ca298c1a986a3af638243d87ad509f5d6f75e174d56cdf94192d8",
            "0x0f57952fafddabec255ac8462d94db0c3da9441a", "a20ceb9e933009767fab0665c4c8562d57769bf51e9de89384dccf0b95e519ea",
            "0x2f49da1bf15e78cdd0baaf4c7f972d5c586ec58b", "0a7150ee8f937e1ccac4d7afb761b07da042391cf00c6af330d064d2a94fac07",
            "0xd4567ab4cc9d2a99eeade460239916e0826d2a88", "5a08daee45a967f13ba6c33719e4966593249ea21bde141f00c27bc235e0278c",
            "0x953602ef21ca1525e2124842254e176dc53858aa", "d026a4a9e10d07f50fad478039a2d9f2769410475b77b2dd1963ce4648f81814",
            "0x1e669650bea70e83b3581ae0c378c4954317e4e0", "c401588c36b92a427abcb59d528e6d85e80a9bfc6486aa2a523645b08e02885d",
            "0xf097b1c9c5a3b00dc632a4ff0d6098a782c7a3b6", "7e6f265f6b21f347b031e08f7012bbc2487f973219b58ed7bc9b1a21f5c0fa58",
            "0xf26e8076abd9df7f8c379451250709801b4916f2", "25e99de46fd4bf8b0de7310fa5a751df3bd346b135604a310bf9378a9372849e",
            "0xbe57205e9d5138e9feb3b87a7ec3a2e8233290a3", "e4cf133d19e4917df237ababb703b660e44eab03ce92162ca110a98f232f6a7b",
            "0x4719bbbabbc7b1775437781ea3f0a37d387c237a", "61918735f9075ff2ef771b0f7d8f30183f41593b371d1c12cb2b8c713acb4103",
            "0x2ac03c05772c56cb9a13dbae8ff5f0215b6da814", "dc1e6abf6cbc354df236bdfd2650e65b977c5cfc2ba98909de9016d55030dde7",
            "0xdd5bfb48afade339438185c2caa3581a6625c346", "b1f31c9d2b908f2d8d72df6a410c756df740a2f9d2de9bea3ac58ff2dd648210",
            "0x9ed9a927f783f687ae750a2acd69835b7ada9f79", "396d60d9dea89d5ca48524dc850b9a7a8d31eb281cf3dd85903a18f011b19b13",
            "0x9e26746b9d80147b98619e9ba0714ae3b2f31b57", "e539d4cc357700737034b73a7dbd19ba4ba7dec8a6dd64abb3c66c7d7108d895",
            "0x4868e4615d86d8f6f37fbc0ab5c0b5c80eabbc3f", "3976b50f6076d7409b93a53335f33069175b3eaa3c6981d058c1f9cbb3d9cb11",
            "0xa7365f582e234f8fdb2d2e95f16d45c2a3e1cccb", "7f1ddbda0f23f7b8f63709834daa8c007f166a73286055ffcfb13952ee582ff1",
            "0x661236d77c5d0a93e03ff4a085ef655969bfa5f0", "20c8e98683158263343ef6b420b9677215786e38999079f4fed423e159facdac",
            "0xf951e6085e455cf3c14c217384a7f606f16bbe83", "1c9e1dfad41dbac9e65bef663b3e8e0ff84dc6129c5df65e82af934b9405d7b5",
            "0x66566b1d5260994750928b7bca45ee3bb5bc96fb", "3c9205711d79e30b18d0906601ced5c8d53afc9f17d528a2f7c489c4e64d7408",
            "0x5945bc4272d601c6a764cceb1245165e8838528f", "35107ab43ee444e333c42126e079fb01c76c2431d9cbeb849658725c1d8d11e2",
            "0x5a6b0b1d7bf02a2a134c8e92607e383a98d3141d", "6728c35b42542bb709dfc1bf2aa246375bea44105871e22acc482ade8086122a",
            "0x58bc0efdad8d039a0fc3c0d046e999d1836122cb", "7a8010cf974ad7068d6b4f47d3982e7ad0653099fd67b4c38238a3e452fc5795",
            "0x600ed3a4d057187288a8e5ae38b5b5e67ff1e991", "eb0ba9ca2f253de749ec5a179f00cbe0155cab37e6e2fe5b64b235b3f89f2a50",
            "0xab8297ef6bc1a0e9653271dc920447ed3d077d17", "11c13b015c45cef32a906b6911a1aab07d14e8e8a014fba28f46925bff332341",
            "0x28f8a0ad9043dfb9a20a7a063fe3b4a6bb0c4a5f", "4b3aa663db8cbeb6614f1863bdc71c2032ee0a9e06a61ad1677c66ed6c5abd57",
            "0xa07c33844309899577ee354bf5f27731e7a21545", "cff94e921be90e3cc69c11c42e2c0eb0d84d4a06a2cc8c0549d2751a3e06ecef",
            "0x552e71b1daf80c4468eb68fb4f83a0e33d3adfaf", "fa83497587a2dd8ad1abd5afe9aa1a69a18b5f8098224a90ddb5bc74d3ca1c10",
            "0x4b8e8be79c3a3b4c7960cbe77436cf1748964e0f", "c55889aa3f9ae3542e2698de342b2fbc04d0ffed819d186f805ae7fa94c1faa0",
            "0xce83d42ff891536818424cacb1a28a9cb87906cf", "c532649f94cfab16bcdf3e6e5354f68e4548060ea8e378773c02cdd60206d77e",
            "0x874b3291c2d7555f7d028e03306e22b810597ac7", "cbf7617a8022cb7be97288b1f5237ba3b8f8499f1054fb2784e9499d8ae558f4",
            "0xe985f7a5956ec5fec183542d8af45e684d827a02", "2e2bb630fe4c0c1a06fafa6fb01f502b1cac24dcb77b078787a90aeaab8d4f9e",
            "0x8bb70f20b93ea737cecf02141182a66ddc7eea4f", "633a380ed41a059cd1f68806fa0d1f5eb0e70e245835e9ccf9a8c5132cdf0710",
            "0x6d92ca8d74494612d518ccb92fa46917257f08ca", "e70ba896918ac58977eb4f90c6b12a0b7ecb4c232c50a627b37564a83ac1b42e",
            "0xb5076a24073a8a3ad1275ed387714a8c26960e9d", "87d56e0100edb608219190bda783a3d184f6b90f9adaa10f75f678f33ba9edca",
            "0x9f8ee26aba372483a33eb5946e7ebd8973e0c9ff", "b6c424d2cc43e872cc0d940c8d130226dcd5d8a5a6e8334ac1d5637f738e7684",
            "0xa580a0af9540e8b895c3fac02117af89c85bb7f1", "b17e26abf06e86d6fe3ea06ece5567050c388b7b0937f23d914767af6b5631a8",
            "0x61ea7265a550b0752a4f358feafad02a62e68c0e", "e5f4b3996c84c78e6dcb728618184128399add4e8fd6926ad4d14199a966337f",
            "0x5a4c3f3e6f47804c4278a32e66221e9c57e29410", "0b634516887fe0c2e0699fb8a332b195710260508a8b7d538e0b3e2ea96771bd",
            "0x3ecb9ee8c700df51c369b1abf3cd315f93962f89", "e856fe4d2a1ca7c80d8495569328140e566300c02998a069330148ea1837249f",
            "0x9af2854a6a250ce11de55104c0faf6b4e9cddeeb", "c446fcc23d6c9ba8eec7f43c9c72ad090f17c0e61ccf3a9794259cfa70ee711e",
            "0xa98b529e63ae773c18e608b41a4a2f53c7a547ca", "2c5664d43eb6c64281afced93895d5950acd0c3d728c2015df0ece08f91e7e76",
            "0x3becb2c06a74db09d98a391cc5f7ba5ed15bfcb2", "bf39bd9b2881b988170d862c50627307851153905275410ab37eb7bb27194732",
            "0x1c62fd0b98480061126548e6913728c9e343be5c", "5befe1f766396eea8b39caecfa50420a35972c1bef13c4905d8462d892c966db",
            "0x10fd28c9382e489650448f53fea0670459270824", "43149e298e2c562945131e0960abcfcb0caa96eb957925eeb946f74b4d5f02b4",
            "0x2ee05cd7db9baff01e62783cfa0d99f362db21db", "256208a891be28da36053e50dac3f9d2a549ab327f16949ef057a0462169deab",
            "0x67c2e16d8e4f9e97f8600c77f8c767618fd7def5", "6f24523ddb391b045b30d9d869b8e6bcb97b86b90f798d1a49703b49fcbff58a",
            "0x5f2331295f0b5c5781e403b252d44b3a9948d175", "aacf3f22b28342fd27cf113d47093c6aded9e2fb18a6bf553f76499f21df1106",
            "0x486c1df0bdb01bcc1255c6339eb5e3f40af79d1b", "bd524675f75f5bce61c4e5efe4eb36e06d18aeb08dbdf8319ebde88a0ee8e0ab",
            "0xa96ec56796746468652145c7e6f3cf89580bf0de", "0f756ccb237c77bddb3fcfe0ea799b39d44dfa70ea0ac5f552f6a90553ce54d4",
            "0xb69207592f26c9fff80862d48095beae1d66e4c9", "c7e82e1a981f88a41eb7d9039b10d9ec945dfc8bdb6f69af96199a445d898097",
            "0xcc6a62eb02d89c71afbb92667a4ea6c59343b468", "81c745fe9f379f45c52467696dd6691a14f38e0a8cac12a860d63c03c76cb30c",
            "0x3d0410829c06103365110211ee8ad4cc2b7c5040", "038da01de55c847f55d190cd0dfb04e7fe37ea7aebaf71b833b900004d844888",
            "0x1d7928b8ac48bd1b571278b41196095a9cd134cc", "8945e46df8413273f703e98b262a86521725af8c3302135e7c9b64cc670e0e97",
            "0x78b968978083b0aad9438c2d936fec6447df4a42", "bcf22b5711a2a1450b42c35382684b260bd8ee01caf5e906e826395ff13eeb2b",
            "0x6538456a6844195fb91c65799bf96e8c4129d28d", "54facdc7a059d5bc772573312a940631b06aba27cfdefea31075624b7db01edb",
            "0xb020cc9a6be768427b08290b914fa3ad74b7bec5", "7162621634198fda8011a4a7500ae11a6d0f02537ab93571c9a94cd43d2bdae5",
            "0xff8c6c4b96ccc3986c60e747fa9925e9882071d8", "3a3805c6e90fe15f2ebe5c1fbdad9e928688d61398cd47ff0bdab4fa39dc560e",
            "0x6c9a0b02daaea1722dc0f4c82be7ac6c67971e58", "15ef1e8718342b2a33fee8d06eb0200407de7957dcf1364d1cc8ec763544385c",
            "0x1ee52d168f3ed8eeb5d1c4f6aaa0a6fa334699b6", "2e35c01b913900e086a0c033eabc0d0e7e7b170f4b72c55c9b7c8d0a05052f72",
            "0x8c7bfda6ce899d7486b0881b4f8482140831ba48", "68e38ab07ad81c297985b9b10b6264cdffbce468b974685693a298957ba968fb",
            "0xd99a3ce8897a13b1babe3bf093e8e036cceadd76", "a71a69146c796ef41a496d1529df4a623b96e385c1693965be3c02cdcab41567",
            "0xa2012d9de1a03a93a120cecf5c03bc29ee8b3209", "8cfb259c22bc0d891b1baa5ed5b75da2301ef60dec210924e2a2916286aa8df1",
            "0x5875d1f2ad76c1eea776a15fb0a7ae6b0a272350", "7fff386a25778e7ba0e592bf534189d7b12c4e82055a9bd57d6fa225aec96be6",
            "0x5f14f57af5def6678f199e5e23fb1fd9a9362a41", "8952565316f7e0809c075e87b57ab81198074d42b58a1f4c0ea3a71915a85586",
            "0xb6b753f0b2617c888020a3dde233310738955a6d", "fdea6291ce721691b18240608e1ef3fa94c401628027a81ca6992d4b6052c572",
            "0x1d87f4da21fe3d3e52b2a7b2d55b474ff9787388", "862ddbe2be9eb1cb2c628f2aef0d85ed385521fd69349c8b56bd13789f42d2cf",
            "0xbd1bee98e4588c8e7bc113166022fcd6ff5081f0", "5353240daf1d7e823a8ab138f4d0642996e0061180c0b0bd5737ffd3f5e55e56",
            "0x5151f05b95a80446649b6cc032b2573dce85be02", "93c2f0aeecaf1bb7a6e008460081a42b4ddf0a2871f7c03a8cd6d172a096d162",
            "0xbe8b6a93d6d2f592392e56cc1a85ab599b3e4f62", "991f4b92b5858cfe546f3381e24dada4931612541c94f599d7c837e79e426d06",
            "0x2fe5074d477b85d9c70568151904c82df5f6553b", "39e32d2d8c67e80a23438add5b597b1ab5abc7f33e1267b0bbe4147468dec35a",
            "0x0ad8711a35fcfa18397f2fe3968589e09f60240b", "2c5b371ac002d56cdb72650d9e022b85bff7c0c82bc7db9d7aa15f318e82131c",
            "0x71eaf3af48132ca90276d1bcf7e572c4b23a9b6a", "79e1cb4043d2bc26ff30c53cffc94f25e9d0833be2723c4246ec09358b609e53",
            "0x1fb251c3e60088970824813d6c4cec53faa661f8", "07909dd49df339ad1b7394791bc095337ca811172befe30f9b73d09dd5b3a000",
            "0x3776ef662a65493d3b86db286b6ffd6cb6d47e66", "77c4fb899cf743388510b9db7ccf78b028de7839ec73dead61df17d32b6c931a",
            "0x2909f283f2cfa54c161cac1fa95a393f0e2e6973", "1edfd710b4ff5b83499b6ee254a2c92c589340f3670a3f43b74757712fd8ccbf",
            "0x6ee736fef5bad46d2b2df16ca45988594e55dedc", "5cd07117970687a7eab8b987e6dc3bcb9f61fff498601ae77f227cf6949fdccd",
            "0x63a0dec9176a5555ffa0a8b92a4b41bb384ba315", "711c408be3dc65149ef92368ab8cda0187ba7420936517a0e0e3390e9df74953",
            "0xbdedf96a572471873a8daaa86652deee32acfb54", "484b9f9842688072a04a4307fd64fa8c2a206d8ee0867015aeabf5739f7aa795",
            "0x485bd1b7e64b24ab24c1b521c99a2bffc0337f9b", "e4fa08cf049565a6d0dc367548fdda220a0d233e0c49fdaded6b15636b9117f8",
            "0xbc8ca793c9d3cf399c9905af1a55dc00047c6657", "7edb53c045927314a6cdec35faf73408a59613443562667320bd97eec2668c1f",
            "0x89295c19c36d4627e3cdb8311250893d46e7494d", "6a7036b34e0e2820672979dec6f5da2704b835a0cb1ec496252a56bb0eba599a",
            "0xd221295e0b6323a82ee53072daa93f997e9113d1", "99a108cf8d3b71fc7cadfc89b9e4526e08be868a55187b8cd1f975d6c28bc299",
            "0x90231a711eb4489987802c7e882ce7711060f3de", "82e2d4633a55b3e5ffacad6be038eb5b51d2e81d980c1f6faa34cadcf3eb0996",
            "0x1d40f26b414c0ee64cbd05644f00d334fc5dfdfd", "14fbb2bb88b790b92718e54d077780cc4569a264868fe789a077faf63723ba30",
            "0x11273a42bd59b80e24163e09fcc07b45914021ab", "cb451002ffd61fa2463070829f52a4a284bfe82592c3a83ad6ab9fb739549fa5",
            "0x9e1f0fffdf98a747906db54a91475e6be68c2a56", "c318ca8216c650b065137e00a3dc3ee69fa879ff329ce34f662206a017225599",
            "0x6121a482dffeeb6658f5e2a4aadbe32ed9afa3b5", "de6d792b2c4cc9c731639253b55cc23d491ab99b1758de12e72c88871adee4b7",
            "0xb0756e88ec1a36a2150e3e46f55954f3a025f795", "421f1c4012dc022680251245b102eafdd9527b8e4e59f26feae4d295e64d4ae0",
            "0xcdf926d206ceb5a21b08a2701f294264065308bf", "0d07b748432ad34af5c2d25300d66b8355700553be3f4059441fc03dfa1b24cf",
            "0x37f2e9a99daa07ed4bdb08f904a6b828c26a4f5c", "4f63b0f6b6ad670a187bcb2f57ece0f489e022d9de8f57fe944d814ab247375a",
            "0x6f186848cac9177c4643ad732fc82bf6d2b8a1a4", "db115e7d03f07d627e9d0ed7293ebb3f92ac052d49f520a586259f224d757b3b",
            "0xde820566fe4baeb2331fc60ac1d959aa32fc4763", "0f6c37a99400820344a5999b17612818c6fcd3ebd3f8e1901db4c91e7447a3b7",
            "0x717f03c2eb6d06220f5ec1b6f1b6473c04564911", "905c162533509bebfa62b71e4791c8a56013f60fa6fa75aae7bc22e54ba6bdeb",
            "0x8d82f510d442f679c10d5818d988cfe43621bb6b", "3cd4e7c1bde2b49cbebf0d0534e9f62486cdb31d309ff3649492b6d274b3f2b9",
            "0x72ed6fbb07138cbab4c6d3f80ae0bbfdeeab9f42", "b016898be9d888382acdd921bfd470c047bc4383536cb9b16b559d1e1929d0af",
            "0xfca2b1bb85ccb52302ce28f832d03dae2320d4f0", "1abcd4db275f2e57ac00c95324f52d6d419807e7785806cc52b5342232137bc8",
            "0xec3b80371d93051c2bb5b7f49f0d27c25d86647a", "6c432a2476635feff2017a438d4ac4f9e6e4596f09ed39adddff2bde658613c0",
            "0x85d6b9064b446615db1fee74b29fc91f164e82dc", "4cba030af3fd0570342b140990f0856970519dcdad794c98c52df6f531b9c81e",
            "0xd45ddfeb8bdcc4d41540118b9e1ff6a39daba4bf", "706c3634dff4d24b1ac44e4bed34eb0c842700733745eae6c961666570b8db6c",
            "0xb5ab1a30cca2da13bd078d6be5f15d854b5f2286", "1ab347143c7833cfcb6e4c97d5d76c3041785d8f4b2e73accda6b26e0f1ae57a",
            "0x54edc390286b662873f78a2567b5b7ec8c3126aa", "91a3233a729e1c9e395f73d8db8c34bd713ba7c9aadea5d3e00cee5c7c2cef02",
            "0x7f82b1673b6d1c390279ae569ee0337089d3642e", "60cefb3363ca73b04ef75756fc32296b4a255209ca22c4966be594ee8c84e230",
            "0x47c4c0670e99b18411ba03fbade122e7a6d2a08a", "d4cb8a3637f55b8828f3a97be210584f485ee4ab96879f388220a0b1eb8da90f",
            "0x1b5ebb20016e18776fce3f112614b0fdc9253a1d", "cbb57d92ba20c66e27fb6461ee5fddd26e5437766204e609cd2324344f2e7880",
            "0xfb3a39796b36f6f523e63e46498ae66df6bfa7c9", "af982c52126c4fdaa080d37c4fc38293790991d011ad14ef92b03663a9217474",
            "0x1ebb2a75927f26c651f0d0e2977c1710d5be580a", "72246ca8c0d752eca919b77514551687618fa8fa3bfcf3bc3c29e326ab0af761",
            "0xf25b4bf355de1266496159d934d3497abcdd2622", "72fbfddf917c164b04bbad00b4df418af10e35afc540352896d5490adca42a2c",
            "0x657af5469b112426d1d8823d7da82e3628335c8b", "420e991da8d2d479838ed8de450d2a794d8e5b78977eb52702292834d83b18c4",
            "0xee13c11c2d5cde006e077b44be2283ee5c8dd7ea", "cf3b68204c806c6dd61e944f66082b56cf04c3f4c753315367cebac5896f2020",
            "0xcf3b0844541f33c92455c537b7227e5dae3e98ce", "31100545b607b022e292de09ebc43dd97e13e99051a65dc16e2e8ea41f4c91d6",
            "0x7cce9eee143fd24e3661ba480bdd37ebfb87f88a", "2ab1e06b16fca764d57b3e32f6b7285f6f637a77602ef4e2c26aebd22818f5c6",
            "0x4fd2d8fc801327e74804c4c36da5780c6aa8aac0", "d533c8010b14deadb1dfc7ef56efe881e36013485eb1f3486e16ae27e9ea3905",
            "0xbe2bed4d990d989b343441208e08fc27910a7a92", "f888effb7b00b3f6cfe9dc9509784d3237db8ba2be3638ca4a2f85d057b7f28c",
            "0xdc50a3de4006da0ee908e6ac642f39f4b74657c6", "be413680fe4ab0e3036173a7ca6379225f83aa15c61d78331ec18e474bd8fa99",
            "0x3411acc8e24023c081710b5917707027029e9030", "140f92550982c605a3324d921e192aad60caa02497d90ef1673eb04eae155f6b",
            "0xaa4bff967e1f29e1280b42db6a6303fe49100bb6", "5ba5b22a5ba3ed41c970a701b85e31812a72522590261d6cc58dbfdeb21ce9b6",
            "0xac55b0701dc76e41c5f433c9b2bc0b4cb8a4eb24", "62b924d442fa7158e66908fe0f4eb985ee970d40c3374481a2784bfe0bf9dd5e",
            "0xbd5b3f8e995e1a7d4784de9d459581b09cd0caae", "becfe3c2bbbc6defd91ad6ab34f8b1a6a3e332e51ee3adf590e60dd07781d9df",
            "0xc3e58a9009f3fdb340bc9d2c6c0322cb8d7e6628", "49364f021bbcb3aacd0a4a6c07cfac5bcf498d34ce5326f7cab453feaeb9760d",
            "0x0f3eb9092bdc8b0c577acbab3ac9eb353f0f3cf0", "63150df221003357ec1e01aae224bedd8af7ebbb97e59e0ec6beaebebabe5230",
            "0x488b25eb8b8117fa4c37707ab1eecca637ce7b67", "7ed38e3e3159a26634f7afbc76b306553dbf7b42d4f64c34a8caf03b91a0e05d",
            "0x9883500d5165763dd75a2d7bcdc8073d6d418fa8", "4d814b2c47e55ae270f9a9298959face223707a5e7eddfc8793e7f32535719c1",
            "0xb91b7d3726abd0c46a23d528ba79d54123f9500f", "7f460d74f625eac4807847be7192f419f6df7e80302c504410350cbba3cb2570",
            "0x942e35bf7103c155d0ef605fd612d76e3c3d4a4f", "09e0fa0353b6c4f9dfd4d4d13aa0cfde9bed76eb0ee5ee0d54cb993c6093850a",
            "0xa2506ad131e028eb041f4aa4cfe99ad820c44709", "caf80a4ff1d275c1e1331c9ecb8ee8dd09cba2ee27d71e58abe1c143e759d1e6",
            "0xf6dcb8eb1e9065b392b1e10458e19916fa28eeb5", "0733c7c4c5463df34ffb2fa3b8fbc1d8e1201cc542d4164c2e2fe4022a149857",
            "0x7ea2a8a4aa2ced601a86b095a3a7e6c9f10e34a9", "d31d8872f759ce412330cc03ea762b5c89659c1baef649059ba60fc1504f88c8",
            "0xf72242b19156c7612afa41db5c730fc0899d6c29", "9ada9655691ab893cfd89d4cc61654e4e51785433be56f01db8d2c7803682325",
            "0x57e7dc1a59fa39fd05cff76a9214e9ae662845c9", "39918abd38d56b3e924c5263cb78569ea5b393755e33fb32b9608faa4ea1c624",
            "0x92302585c67f06a192575e49d30c1a23cc681465", "b78a5f5145cd281881bec5de913022a01b5c6abd0728b190335ba17a6b7d2e58",
            "0x812d121ddc79b6d930eaba8f7cf37cee79f26f72", "9b59e5ce7e8f62c37c097bcd15598a0b0be5e7f000738b5b842d7915be45f188",
            "0x765f1ebd8fe8c038ed28eb29b97fe30aa89fac1e", "1a894c2cdb2b26ab4b3a3ef760f242d0a6406220a68ee6e21845aa641e29e1fc",
            "0xe6c47a57ca9cecbfbe973ad5a84b4df1f0e16b05", "2c645ca490d6c9c37f90d72d3a121e2f10bb4af4199f4434c7b203f01a61d814",
            "0x0ae3ec663729badf877e79bc3b306a9abdcabc97", "b5f71e98721849238108f1f859f80fb62d4b1f35bac39b4f13d3b62814a06d99",
            "0xaaa066a3e15d6ca907a5aa426c50d997e07cb7f5", "19c9fb2cf4b4b67ac1b8ca5afd573e8734d47397d18bb57991cd998d05b69f91",
            "0x1868ab1913b02cb769161dd34896c33d8c7f9a75", "4aa8bcdb2d45145fb53673ab6b0f3d2c3f86fdb30c529fc863dba751ba282f83",
            "0x376971fa81b9fa27eaccf71cab0ced415da0474d", "11efb7de038c5a8d771ea3d9578bf4874073d6aae05038be55ac3358435b022f",
            "0x9eeb5df10cf76b306a65b1be63c74109bae62764", "fb93cf0250e47200130ce08913b6c9cbcfe40da054afc272ab0a96709ae3ae48",
            "0x3c656f3b005c29a79320bf489d86d69e084b8148", "7a4c939723739182bd80e75ea09dc1f91ebfb47ae62894664c95d7eaf2972abe",
            "0x5bb344e57bdcf65f801c7dd2e13c1e1decc2c854", "4ad5bacc517f0b523918eb3a5009fd1b7172e34441cf07f7be2da5f30e6690a5",
            "0x995b9295a9a38bb4035b1dc19f30dec0f9419b77", "d38776c7d56f430e7c7a58106627201deee43ef29a20c39ba5ce0dfbdb2b3ce7",
            "0x05224bc85d8d2ad9ba028fc2c22586bc7ef239ed", "372b78e07aef44f2c7fecbf30b6477279afd05d7f5f99787c025d18c9c9cd070",
            "0xe71a4b070127b33e19bdef3233f03359a090dbaf", "0ffc1dbd26059315af20966de6aed436ab961573b722dda2c6e90af15812f74f",
            "0xc91fa79f5d21f068f51d5d2ada179771fc036196", "6a71d1b5447d9ddea639475d80158b650109c469527cad762dee7deb0e769a27",
            "0xebfbb8dc80c312845ea0b69adb9edb1865f333ba", "4a273325a09911cb98f788a3e4178095e29d67f9423f239cf60b5a5c82b3d22c",
            "0x805acf323e04aa5130eea4378861ea1b25575a45", "bab4007d436e85702ebaf1fd5704304f7d17beb62c9609916d150e50df6679fd",
            "0xd28b8e0df82f1cec8824f26387b5d7044f8291b1", "ff12430c0b09618380131a93e8f4033288f9d36a69ee7fd34e6911cbcb741885",
            "0x34c37e72d4075634e1a35238329c9395fb8c6ca8", "dbb0d825f3457e212c88abe518109256b5578c96e2c755819edd40a87c8b1047",
            "0xe59a23809bfe600729306344735ecd63b395b6de", "aef5bc8d4a70b77e4a135e143e558f774aee703840715d3cc17d5d20d020ae50",
            "0xd27e554c49317b46e31c40d7ff3d4dd6c35c4904", "68f5c0477d6e29e44adddad0319db2b89240ae9464bb18e375831147bbd4ee8d",
            "0xf1d7122db5e82a24881dd338586a60378f0b9391", "6a614be841d80b0f8d8c9d3f7b1173424fb3bb727f9410dabffea512c49f9003",
            "0xa5cd2e500d357b43a530348622d93d296d647446", "41a5bc6a66a6edefd074bf5f5e1530954e0d1f7e3b4953ff56f7d08dd393abe7",
            "0x49f8d8b3b295a0bc91bd3d17dc04c9ef4650fa34", "88fc3ed00f36093141134f24a9cc2bfa16f379c275bb11f5cdfb767c8f000ab7",
            "0x3a2e1df7eba0a0fefc3acd01723f047f43027c9a", "14f3e6dc8972a13000bd8783eefaf7bd8bb16f8b1f8da06a2c7600b42c48660a",
            "0x8cd6cc82977874057fb5b395ef2ce906bc6101d3", "9f95e6e0ce2f5483b5f559b4d3f2594a5c20fdd16dfe8c0dc02852f538f5af8a",
            "0xe6ace984b135b37cc30dcb680ed4bc4f9491da5c", "3dae56b07c4f4f464c4bc8bde4a70c4e356a117770a51d27a757306f707d817d",
            "0xad3caa460cacd113777dbc84f83702eb0f4c5f54", "24f11586deb6e688d97d98bebfc47276719d95e48a0cfeccc2e8c300ec0c7b11",
            "0x52cf806e6ce06b14b610261c0057afc53ebea053", "f96d10c216a5ab1c6eef64a0293f94a8cead7497b105aba760ada38e97d902fe",
            "0x42780117de4fb7994a5caa173cafc8da77eed9c5", "8b43ef06dbe62a4df8eda24dd50941b348931e841b890417d17b590ecd6725f1",
            "0x5804bfcc45a0ccbc322388ba93f35cd37eb2e766", "69210b90a75c6fdb2cb5b8796f07d4ff5df9eacc2796f6d5591cb9095c61a572",
            "0x746652872ef608f9c1ca5d9760d4cdb4565abb02", "5c5a4d12f0b7ebe03d5f9ae0e69a1ff4f7db05e56478d43c49be5a1b3ba27e07",
            "0x4c0b2e6892593d4f2a0303c113f3e95ae615782d", "da4523f6b278359809febfdb3108b123ff3a4875402f3e45e56c463e6697a7ed",
            "0xb9276651a57c18f3bea3a100eb5c36c300994904", "dfd525c1b14f9d9cd2b3f63553dfc40e1376f8fab14e58dcf5bc14ba6eb76aa3",
            "0xeaf6dba2765cd3d5b5095561d29fec489798d711", "b3e448217949ef548b877bdad364ba59db694be6785eb8766fb2da9def461a30",
            "0x09a5cf28d005af3e8cba711b4d812c69b5657f8a", "ad7214e96178953bfd8b90ec2b8f0caf6ca6041f30c852efe7edc31d3a217972",
            "0x3d97be178e48a16f6c94c55e023b1f00b42fe1de", "29675eb6d8e7583a048ce513b3798f875cc74311a960b59a522f2be6cbf8bf7a",
            "0xfb91539a3eef03be5dec8fca3d5244ae620462c3", "57a4c27f1cdfa3834ab767f0c8c46edc1e28d25572abe7839775c933bac5b6bb",
            "0x256d9cab89044ea42816607530ca50e1a371db12", "b497b7d4662bf2e4010686f389ed79eafe234ed44b1e5a0b56c8effdd7cd322a",
            "0xf0663fda3ac930c72d095454a36d67fd7a387e5f", "34bae9ca4e5ca908c8dfa24443c7d31230a22be080d7fdb9ea059957e2beac17",
            "0x8ac6dd762263820da50ba03339adafea4d7870df", "ff90d279e3a79565f09780736de42019d29ed8edf7caaa42b64370dbaa4786c1",
            "0xc8fa0a90f0f3562d3e890c8516c8f3afe63a24fc", "0572a6e11b0395ca526171374a1609d73800cbb44dac3534751e5697872cd06f",
            "0xef9fcc5f64c2798aa4f7c069b9e67296b92fef7b", "789262018228a127d3a2346230e4ad23f8fea0315cfeed34a96526163b34d993",
            "0xf7cfe13522916f79d3a0a565eb8ba08b655ff4e9", "e83b21f9a51246798c893d45c9bc611cf7424a6a804360a3f25dda4dc7530194",
            "0x4c8ff8da742704957e35bee966062aa511f23741", "36aafc0d93aecbea9fad5842398f7c57aaa42e1c631ab6ed02a0f02564a5b7cd",
            "0x84acd37c658cf6d92279e4de24272b863717ee8a", "61400a2ce4e82eba5a7418f665432f5996ea08496d491abf38784a8302373fbf",
            "0xeec195c984737c587188aae11c18936398a561e2", "3e60b5d08d09bcb1e8d45cb99acc82c43fe876b8a3f4ae5004f1b7f444bd955c",
            "0x0c1cf5d8397dc7c478f0495a69ed347b34a867c3", "b49fe22b391e2ed8f8eced8e7ebc5bd96a7218269f2b8d265b83cc84a05bb8de",
            "0x5428c2c3517ab46b21a68e5b690295e33b44aaf5", "efe00dd5d5077eacf6940ce6cfb21aa5084797caf832caecf61e07bc9a863e3d",
            "0x5b68927b287359a10bb5b972ea3fe8ca75e9c00c", "c46818d7a1d227fdcc72c5a416bb2d07b7c38e8aad646dd5992cfc546b6f84cb",
            "0x8417ea03e873dd3edb87f4952537b4b5427b2ef7", "6680f48a300ccb69a6b119a8f5e6977a942bdb8cd45b3c5ecd4486ee3376029b",
            "0x6b63a68ddb488e54a847f62b699572d37c1d4c02", "dcfec06ee2693ca586b7fe403dba7cf29d02fbbfeda767b793e5cc2efd7c2c44",
            "0x24d02a33468ac80352a5d38cbea37d70b885873c", "72fb2e1258459ea683c53a636d0d5347be4f080bd3f7ec7e92b01b592e89a518",
            "0x116c596723e007b02956bc9cd4b4dd6e11c0840e", "6fad09b661b3c0343acdad452ef73efecc47298f505cae2b41b174eb65e0292c",
            "0xe14e81986623e5dbaf37e2cf342dab9aca3b7836", "590c4b5432fbcdfdd6d3b3e8003b6c04894fe6aea0092611b5221b6e78ae97bc",
            "0xe13e04deefdb2bde6d2c62c5e1cbb037f6005f82", "cf3abe124d96c459458375072e4de51d35deb9efc627607bc26b12cefcd7da16",
            "0x1f0e591e2e693ff7c9fc037e35b3e72a10c98dde", "cd06df73db9433889f988bd578fda20d562a417f74144e77fc689160690c7e62",
            "0x174329405012b30389fb3ab27c3c017b2b317bff", "fc25a2b43cd76582b1b660e1e091713388c929927a00bdbbe449d0055d5a9562",
            "0x07c35efc6d97e4e63f4293777a6f3dc17b6dcf86", "8f58b1ed425a60f1db7095bc95ded087db8f50f798ab0a1b45193209f40f8bc5",
            "0xc22ab76f0a782825e9b8d055c2b7c97abbf8ff6e", "dca87fa47f89e60371542c72858bad4f6a659c548019fb4a8a2434ad63c2b4aa",
            "0x166561f338f5f091b391467715bc0cf053fafd2e", "25143e9e724b6312aed185e2ecbd7b7dd2da95c87caba07af49e254bab348a7e",
            "0xe81d6e6285da3a7d63a4101751ead5dec2adfcf4", "64fabcea771e4d716738a51464a0ffa29613708036a704b53132fb7b8fd7b961",
            "0xa94b7e933a135cca484843caf14e200a6b6c3c3b", "8542d656022c98e70ce373d42e798bbd6c3ce92468ea1fe60119d175959ccf1a",
            "0x760efeb42f268dab0f3985d2c488c13fd440e301", "bc1c5d48c2e0c54178589841159faf8c55a3e7b8a2fa89b16c00832766e4a4ee",
            "0x774c9cc3685f98ce2f25243c76aef32ae132f604", "43ebf55fa1f39eff72bc0668a8b31d7308ad669861032dfaa0bf4b2b24e63435",
            "0x490228dacb6648f779bbc6c4f25a0e90de26afb7", "4dd492d7f9c18eb14b3a209b941b344f08b5e7aa90d4f4d94592cfb35860bfe0",
            "0x4acc81c8039de0c4320ef0a611945aad2e405eb8", "507191b53a4f977b926ea01b7320d9c39b0698d6314f601afa69890e87911648",
            "0x92512ab7b6289a1aa9f9ce41d36241c700e84f33", "9b09e5141ae6079704c200ac1a26cebe32d8932a851cd054f0ddfdac88e18470",
            "0x967675ccd0543aab3c6a36d3a91b8f6870582dd3", "44ff06fbec0a82517db748dd63a9c1d03281b10c851c634e33ecd81a90c42463",
            "0xcb8fd66bca92a7df86c6cfd805a8cc1bd23124c5", "988266728aefc0593af9bba5b22af81f362f30038514c7f0fd7379474058809a",
            "0xc9d291e734248e8e9c7b2713813e896b369fe801", "f56539381cd9744f5d59df4197385a650a231cb239e9d63f14e57c264296da20",
            "0xa03aac2859437013faace6fcbc9d5c0b6bef3e54", "5ec71e21f43c9f08bcb5f012217915d29af67e7a2db7ed45efe764a989d0aea5",
            "0xfb874555aafe011f46a7603135bfe19d14ebcfe9", "b834822fa97e2545957dfeaf1b7a542296e0ab40307aad13943b138d4d2f4e00",
            "0x3a738be502f6a0e9190d0a6a4a450469f4d70da1", "212d73a9e1c041e6ae68896dd3ae39b386fc8cd3a8628a3609dc54f1368b24b3",
            "0xe85922b461a2add828e4405254990a9076923332", "72dd4d9e64b98a491fa5e2a65a03d3724fb8fae4abc9bcf4ca2da3989f0e56e3",
            "0xe1a6c266c1c25483b54ea865b33d27084058ea20", "27d36502c5cb30af23a5d4fc42b1e62132cd9515c579c9c06d4f8f6d593a6536",
            "0x84441bb986aa27608211f0ee40567825c3692074", "d6b442d611e216731f38e3eb05a0168ec4454b214ba2741877a04aae10b14c71",
            "0xf256efbf78f73ebdfc4de8d62634c4fb8832b749", "7139a9673b334f6b1eefb99c3f611a211e770e1588b421cfe0fe204a5e3e2a71",
            "0x5f50dfa9dd04d3767d7ee5f5f9fff7b92ad1938a", "d53478ef0fa9876a5bb8f4d8a494fc48df25969f9d6598680f66d6d5329051dd",
            "0xa942d95293cfa7f22c4d7ec170d2bea271fb1e1c", "da501d541c085705d048d157f971f763f1bbf764d89246efae258e41d8945193",
            "0x91256a70d3e2b3d639e3e29a70c5f65071b7c589", "463f91341e8097e8cc2112e576a204e5d090abae01727da86233b7cab5ee20f1",
            "0x0e6df0f792d22f695cb1e9e0897a14d02289f474", "3686e304f45eb3fa502e9a6ec92b8d8579dca30430e3af1438072c67a52f8ceb",
            "0x5e763940a66d107e6de7d038892eb166fd7820ce", "f9af8cf67757d762b96fd5290775681fd09d60bd621333dbe6dc0dd762172034",
            "0x7e54457388976407ba9bb948e80ad1be7ca3ed22", "d9e3b6059e18dad6d2b353ee33a348980197c1d47f0b5568c034cea9b091020a",
            "0xc8ce0da6ddc1980fd41888e46ffc5feae0a336a8", "30fde620a0fe120ece4588580abe1a75cf059de7fc066ee363cdb57059694020",
            "0x77dc2b0c53f8c39b0c73bcc6bca8cb2e8ca10642", "ceb778a6ee7ecc5d6983b78f80acb9103b1c17fe32ae3034b8383959df3a33a6",
            "0xe9acabb3008cd9051f68f93b07c9e9cd0a0fb332", "976137e507738cfe1944273c952b3b594dcce605bee49b454de89f9db117c9de",
            "0x9f1f527ee1571f13eaebdcb24f6c9941019c12cb", "ccbb65c1c9086afea7373c75e9b0bd9ade2dad049da6f6b38c56d7592186fd1a",
            "0x78b7d5eebf386d165d2eea92244bc20e5fe0ad32", "feffa8d816670201dbf0b70b9b2009e1b62f8fdf2fb14befe8b22c11e10642d4",
            "0x883a022e58dd64bc555939f86a466de805e0f0d7", "26f5229013d213d3745b523ef328e18bbcfc8f52008da909884fab7ae018a552",
            "0x2d096f3c3688e882dfdaab684f119607b6922654", "ef6307ea5994c74487d96d479c021a761d85807e18a9e1d2c481be6a28d6e046",
            "0x3e29e7fa6b74b7cb1c4e0eb9b7507dd7ff70739d", "25e8af5d5817f67a2c3e2da160ab0c8d4c59aa433010d6c965eab393926d5ede",
            "0x85e02944310fa3cb93ad2082419b387cc088e97a", "c9eb734bee93d91446b34e0540020dfde0d4dbe971b3db844b4d76eb5957684d",
            "0xeca6e61e7d802e2f46dc9bcd46dc8528f1a7ab62", "6ff472d59935dbe6d3a47b7b92109bb8d70bc0efe9a798b18bd5e2c39cdcb0da",
            "0x72391c85cf70371b627dcdcce6ab65fbf9e80601", "d9a36af5040aa04c227016b1ff715ccb0d418dca3c3a2ba46ac55226ef26a572",
            "0xaa50e74dd3b3e75cae14d06ad48235a6ad794736", "463c396743f849e54ec1ade3adebb47b27f0d1c633e7f66d64fd3434ceee57d0",
            "0xd70a1d2f97f4d28c962665420c8fe9ab7aeb5068", "c7642dd6aa4655d40ce18bd7e46eab0bd0fd2193ba5f95511e87c018125078b2",
            "0x3ca86ae0f5404f2269f726f8a8f528b3aa892dbc", "c5cc628a25647c0e7aab1cf8cd36c5cf55c5ccaf3988a53d59c764b3acd1a73f",
            "0xf67c7d82e20b3e75e87b8f38c66bde4e644f6ed6", "228632f27cc7564c4b0123ad4783fb9b5f7799d54e3a16a2922ee446af21fe2d",
            "0x5c09976fd03a7bc558dd4ad13c9fe6d7a2add1e6", "bf73c1f06e7706602a06991f416fe77825d852f4d3025a79fa75938dd0604f05",
            "0x0601d915d6921cf5aa690202a21468f0551b70d7", "5b2400e23733199af7466a3cdeb93ce49145373d8338ed549d81352fa838b092",
            "0x50b791a508c463ac75a8f58d188953cd6432ca20", "4415ea0e3905aeafa6293b4a6fb12faf7ad13172eed6ff35e4ff56674fb6930a",
            "0x8d1d675c76fdab6633cc72cc8b699835f47ab7dd", "bd596d23250b21de200cb44646b0e71bae3dd32f93fe05e9a66478483dd20639",
            "0xd2c4054a0f76b0a4994143a5b91aa4286fd67c2a", "aa31835888846eff2ffff4d8aac1daaa6f4e3e2da0071e15ffe9341284f354de",
            "0x1c0caa856a1273c6fb28c6ed1b44ce2496735933", "b4aa1e82e20f4f42fc5ffd0ab0e6dfdf049e7538dab25e530ccab407e5fd7e13",
            "0x31f6c210e21b24209f19747c9b61c5b62f9f3f52", "d617be930c6d6ee2bbaea6a31ac2ecc373e6db95a039f75f38d76823dafe7533",
            "0xb4fa0b1e0b211c436fc621ba6e6a5704e90c6542", "259a85296604b351d6ec743fb44d21e35422673f4c5e5d50f45f647ec2f8e50d",
            "0x7f67309cbd29317ac173dbeb3dd18716eb0ad913", "6a275bfad9792aca6504ae68ccc294c2faa88fe4649ddb1b47378dd770201429",
            "0xb2a624958034fa248e273256c31665ff011d9c73", "12b5a04c2d60e931d3819145dd12f1a7159e7da95b0a9adfecf4633edc0cb9ef",
            "0x4397774843015e52db67c259908e5f58630c431c", "20a17cc2d45bd0e1736d306c12509bdc7725cb4d4ad9c335cb35a5f473f3d589",
            "0x8ced765fa6b008541ea0afc6c2e0740b9564d84d", "96580d394f46001484b05565679ea3f715c4769ec2391f48ab2128b2cecfaac6",
            "0x07d8801e7980eedf40a402d15af5611a940547ce", "639951d92dae737137f3f88502539e7d179e0a1bedf6aa70b28698ffacbf553e",
            "0x19ccde5e9f346f56f328315218545696a8092bcf", "5f1f0203d5253ec03990bfc5c97331acdff29b2324d2fe3d0d7d922bdeab1012",
            "0xf05e009a807d9bf0219538a869127cfecaf16c24", "fccefec1464b8d881b38bd09c49f7254606e75ee2b4071db2a7af07cff41fb3d",
            "0x057126d866ec18170d1244045857def533d569c0", "d36361bb0fd664826ccee02beb135d99ca8c8d7257e9e12f1eb5d69c3b0f177e",
            "0xb30a8ed3296b10af754390d64e74f438029f9498", "4e2ecfeb99a416ab0b1ffdb3be063301a81c23639b8b027587f3767cc79fa92a",
            "0xe06ed8f706c248ddc59a55c9ef2fc3587cd0ba32", "31ad0a611daf75c88cabf466f9ae79f290a8960af6d9a097a844e5e30b268a45",
            "0x73e1cad6051e41e9d7ba90b06c15a12dd4babbd2", "7b7ae5d7eba59f3d1cf7ed275f5ff2c6778133f9ffa2715eb6b7eaeb328c6e46",
            "0x1c6fdb4b48d771d712b4130b6267fa4e70840d88", "70b21aeece2cc0f92d86321e17d145f6ce96dd99a20c41c2adbf3129cb65ffa6",
            "0x962aed881a1a7f715bb71dc2a9745c2634f9db8a", "385f92b8f02bbcfa71b23796d9d57293666730414d3e52cf0450cabdf2249e17",
            "0xf4e8f9914bbe83ee78938b2abffe1948bcf5521d", "133d4179c952d1f1390ea63055f10f3e07c21ca2fe4e0d43ca8a95206fa1e2f9",
            "0x1b74127623b07b9c7e5bb6c968f2791462788bcc", "87ceaefb135784b727178119383a79d5abf0d9faaaaf1e821fc3a94317e24e5e",
            "0x1215cff8e7db70606ccf07a27b5cf8980311e60a", "21755fd2be5a42debb48c08721081d2e509ab571925782c27d11c0a64df1749c",
            "0xba051d1be494fc35ffc3a6d81f6d1c49f2661f89", "5ba4119861eeefbf163b05c114b2a1d3ff734cccf185e2511fde8b4bd98dd6bf",
            "0x79d60f9ef65fd9fe1974784c406316662fec7a11", "97adb67726da87830cafe1d3697392852fe89505d6a3f93df69806402e7e8037",
            "0x06556af702fe62d1579c1165c256dfd61b00bd49", "f3112619b09e8561303f45898f5b58128bee0cc6a4a9812e10263ec993a82d1f",
            "0xbcd83352f0a715206b5a2fcd38e368baa04979e6", "290c3b98ca5a0b8945e686ce55022b2dae2892b3c6254c479b90a6306c302de4",
            "0x9ac88c019d8d6c86d9dfba0e4903763c321afbbf", "ba1f5659afc7bf9e1cfe49c74539b3121be892a8517d08b9d25c7cb35985cd6b",
            "0xb63144ebde253ed78520e2764fa1dfb3363df059", "ce41c0c03b54fee10c84774fff798818939850b5aacd01743a9c6f7bf8ecb074",
            "0x814857cd6af03be2e70025207ba81bb759c47608", "08fb9284225e36c031760dd3b01cc5d6f29771bedc6d1b84f9c8cc38b712da4e",
            "0xdae8d161da10f451345f2852cde742b3b2fd71c2", "faf1ae6006b35f35397691aafc094b4d83e8decc649bac174b3c61f7292362fe",
            "0x8f479c6206191bf89dced73327d47b7130959356", "69d73378480bf434638a82a5dec690bc5b2e9940747aa19b5e6c999e30d8fd9b",
            "0x38932049c65c46b643cb685c38c5857c507c46d6", "0e47b6d8cd58f88b102bbd1b7082132a38dea05ba92a69427ec7d3bc12519773",
            "0xd7554d12dc3e41260e9dc05a90e930f4a0ee75dc", "b0fdf97bfe9b2818bc2bc4f3118810882c4f3833ef59af204379c2acb2aca28f",
            "0x9c286049e224a409f088c031891c5faddba4e957", "206eba28e6c4c40ca9db093673a84672d729434c65ab4d320fe4ba687cfd49b5",
            "0xa0f7a22261eaac0612dd92468e5e058f0bcf67e6", "102287560f6e41e7da1a6ad6b162373a9f2d39e9ac0b627b220052f2ae2d4a25",
            "0x6a5afb1486410eb3c2588f0d31b991532a256d35", "6b0ea54577f6e3f82e89f5f5bbde6fb635e707437055919dc4b81bf5b2097ebf",
            "0x06d7e43a11cad819be48166ed7801b7bb86d3bfb", "c647fcbecc1b9c72f589541eaa005cefbc92ab6afbafa26563518993211df4c2",
            "0x27a0077cb5d04cc5eeb81b8678b0ba82bfcd71c9", "b18c4faf43c39782fb429fba23b380877a2e680a6854801ecb215dced29a4a8a",
            "0xc7513000d27559f456785fd888ae496d07ada1a8", "8e57ab3aa41ee97a69328caa36be3a226ed6cedc41f55e55f7ff1ff98fe1de05",
            "0x717c93175faec6988994a9075b2415cc8bc28f49", "5e5a35e9dd876f8dba82f39249b6dc9e50548d82edc80d162bffec7d2e44322b",
            "0x111da991aec7f9a94b23cd45a51cb73e478a2dcf", "41ca4f6dd18b4a49e164b42c5018988b1fd898a8e1cd869ba052483004153dff",
            "0x54709f72f74761cc9be20749a6548bdb56a63eb4", "9fe688cf4f8d8184974a145ac786370d18dc29d27f4b40970a3155107c8371f8",
            "0x41e8fe06f6e96ed7fc7a2683ed845d9ccc0efda0", "a400f6df7c90a22d81902c105e3adcde3d1b7cc559722fea35b2f902108cabc5",
            "0xe072bb58cac71ecf2b393758398cec690ddd4bd1", "6347c5100dc3bdc6aca2d395708f973406b65a57d0c0b08e61b041376d8168cd",
            "0x3b83c5b73746fe774877e501c1922e162d466a75", "1dae6a80c359fce2cb86707f78c5e2155d24cb66edae9b1661df20f95f14391a",
            "0x5006657d94a57a072de6091a7c7ae0704d1a25f4", "309cf8e9d2be5f1c22ef3ba9d3a9f93c470b051f66da2c60f9e2fbe6586ed43a",
            "0xe195d4466b3ae4c684406b4b80587c6da34338eb", "4b50092e5abafb75f97699620b4406bbd826f43d47d40a66a169f0f98ef33a68",
            "0x5d253e48b785f666679a39c45fa1656960aee2ae", "fefed4097e099a1691ee2a34c85dda3479b793cb1cc306b5942886d36b95d062",
            "0xca1b1a9070f1cc8021ae1c384390c0af0022fc25", "eaf1fa4d0b77c64edb3350d4dbd6015614b55f4d24e8c9d02bfb18f805a27287",
            "0x6cf1b6821dbbc44633271942ed58509189ff4292", "88db22d686475d4477a76333b33aba040dd21fe02f947511da2b84c50eb3d5f0",
            "0xa600a91161afa9b2becf966e6296daae45af925e", "cedc6dc66db6d4b890c56790e47192b1851a30afbf24cb249407fe6f012a1158",
            "0x8e9763dbbe37912d9fd7d29e5f6a6081530c549a", "6cf68e1fedef84c05341bd8f0bc4d7353fcd45bad42e47b0f5091dfdcc8f0c83",
            "0x2ecf475be652c33787bf0ed55e520a7a07cab949", "7fff957a2a0763532859d36e870b6c0a0fe0cbae8bda0f41f9ca4a350f280119",
            "0xc3c2a6ebedc8b3727e76b26c7e772d1bed375f0e", "d4b77a91fce100e32adf71f3629f02d05540a5425793a2c9f942c04b6305393f",
            "0x594ff34337be9083950a8f5255aae8fbd171dc9d", "f05ad56bb8b6f894aa7602125e8c6c88362160cb7a79c1ed5ffca7948d6fd2ae",
            "0x3bd94ae5f8713f7794ab30311961a85b4747df4d", "9cbdc47cce1d4d7686e294550dca607d6d56f28c9c249106e7bbbcc77993cba7",
            "0x2d62e420d11f1c230901056f82c0e2d9ca7a924a", "6ed53d90e95ec1429ae1e3c19e735740897b09ed0f646c7e42d52a91ea58439e",
            "0xd2833ad20a4289014d99c1e5e2375330522a7949", "d417b2c8ccc1cda717b8a8e7754dd16bd15a02f23794599d76ea91d226c26a3b",
            "0x046076b39c46b733a26707d12c846101bac55b89", "63b5fbe8721698879f34ae6e70c1034e1de1eb6a95aaed49c647f144eebbb97a",
            "0x16efd320cf1ee6976448ad3e6bcc4325b389f848", "eae2a53672e3c3013490c3bb3230d0e977c7ca134aedf97bdc03995d1d43aad2",
            "0x7b8281fdc82082cf94053d28a4c809fbd4c57572", "38bbc83cacd80e321b58d47cca7a6ccab4afb92ce50f3a5f205f25103d52848e",
            "0x652b5fb9f628e26d1c47205a2f5879c2b2250a0f", "8eda1fbe4ac825c6ecfc0e7286e5f34905874c76da6ffdbc5a264b4fe24cf0a3",
            "0x192c014e5228ac177fd8de540dec8ec7fea4e3c0", "f4d983b4cf2807d7ec4dffaae9ab7e3ad80122ac52f5c564c6e370aad27654be",
            "0x2dfdc25b059ff8f435cccae1ec83283b3ce00dce", "572e608b16b5a22dea77b3e26d0a50099192cfa5082e3b687cb721254274e25f",
            "0x95093f375286c2e57c65ced20c28aa8a5bcc8f62", "5cbdafcf623924b3fa911ff18252ab7766ab0f7cc901cd39864b558ef2e46c79",
            "0x9fb5fe062e5a7a29de5d3eed5c40cac5cd1cface", "0b3f73f9ef729456b3f7973a420e59143e716e39f2f3978e697feb1b6b4e2d10",
            "0x460c4e80f515cf8773fda2fa1e3baf76702d0ecd", "c59c891361c7dd54debd6b25057a126ad771ca9293cc588acbf5d106621e7d47",
            "0x1bcca87d288b126e42a1edde7f813f159d17935c", "c189fea10bc67cb28bd03ac10fe7212be850e95397f9b4ff06e53972f5e06245",
            "0xa24ef21e0c09db44b1a2a2f15e755cb2222b1b84", "47a923b98c798124aca8904545062e1d8a90100d9307915c3b418a3596d3e7f7",
            "0x900a1bf7df096f938d16d3c7ea997b41f9d4878d", "99f2851f893019ea72a47627dc984cfa4663d67a9f8f44ad0809db4a22687af2",
            "0xa25815df39b7e3f1b14f23ba651c452620d32f43", "b9a62fdc156803be9fdb01cf8b700755262a29169104f12193682d92128247d0",
            "0xe57f0019089257af2cbcb0eed5f1f706f1ff4092", "040d0af22055d1727db2c361c3797aa37aac2546a094f7bd7736fe132e56a4b2",
            "0x8012106a63b2705adc20a425cb22c6d16b270425", "0f11e57041fe3dbdc63f1e4c3b3b029175a79eb4e784d509e11803c5d7db30ba",
            "0xba0ab5e77367a05258d40af7334a19d532d8a61d", "e705c8ea3e643cf9d6dc6e7c521b097b934c549d183e11e5e56d9b817b38b1bb",
            "0x535bd748eb613254bc3cbcf5fdc848849678a611", "d87cd160e7be776f283e3d68f43efe15f11688e1958c0174188b7e378dda4e36",
            "0x684255508767b2d46f1ce52f33961a0217a57e7e", "34c6b3508304a14a068b417b837e2a4f9946f30b410bb7916e167824c08c2ad0",
            "0x0b5fdd7376176fc19114f7827864523bdbaf3dc6", "4fe6eca035991ff5655cd93f158199a449f5fd58e43ff732e46fee0a6a3ea908",
            "0xd67e6eb6de0b4f8afb712950a5aa733958343749", "fbc280db274b19493be0399722f812c061f5e9e1dee8d99bbbcbee0fd02057f6",
            "0x0b89e3577d7c9f57d222ecc25753d2d553880c57", "d414dfa668e37549bb725faf14dedb31dbf95be2b2f4521d4f71f3cd09bccbb3",
            "0xf0dbfe93b949e6062143ff15dba4bee1d7a8c6c1", "abe06e7b57ce78d29c47d4f94a2d81c12102738e2a35c5a02ae2b5260d9d403a",
            "0x40bba226caa7fb14d366c594ca0d2ae495f5b2f6", "4f1d83ed86b9d4310e311a4a3a59c29dafb4f06c2c46e48c1d6ba765e8398b5f",
            "0x3b2a401452b87725d7fd9c6414b2a2fccbf1f0b1", "0da380310aaeb689cd950bb6073dcd6933a1d7fb5f719555e47a41d4e7738f7f",
            "0x10216a52736ceaf18fc2aea2a9c5696a07299d9f", "e8fa9c784265a88622601feb223583786e74a3ec182eff355d6fbead2e5460a7",
            "0xf91ef1c24e763beeb5d9ee169831af6b555098f1", "7dada6e10930f85faee89acb7394d0ee22b5e0ebd5c34033956f62a741dbc888",
            "0x5dcb4f1ae9323a0229c149f934a04b5851b06104", "a65aef65090fafc586136433f764e0616c811a25a6dbea29fbe40be1eef93e18",
            "0x0f4ecee82868c9b006a460cb8094e05bd510bbdc", "28b1ff9f2fa04e2d4cf426c8f493aae9f2d82913ebb99a2ff681b1d71732927c",
            "0xfc21b62a718d6efe6b388b088df2c6fa2bf8f781", "04329d7f0594e298545d675e37d49f7cc59e0fd261187fe55f88f072fd54b7a1",
            "0x5d6dcc88e13bda01d3d5f6a7400072f8d90a3ec4", "af4170aaac9bea2400336f89d3f5bcffe0186933887d4b9d5ddc910677bcb476",
            "0xd8bc2168346f99469a3a40860392b025589c8a4b", "ea692e94560f79c8e0582a13a15cbc567302957f7dd4a3aa0069f1dd1d0c6426",
            "0x28901d757353bcdc9b1854d4b40c623de09695a3", "f65ab11dd615edcbf00c3fe3cb6159ca69c08d655313fa7081da1ce52619396e",
            "0x3ddc30b84f33983b870feb192c32cde86f671176", "397b722ceb55f0c22e9e3a3decd18841463b55f50f17f879a7165c59740a20d0",
            "0xfd4bfe6e90259ae442d884651ca0d907e8deffa1", "fbb7f48ef90d6f748ad95f2426ae74be1f9371f1965f6a2fdb366b759c4e270b",
            "0x240e9de194f449f8625db69a587bd4d467e7d45e", "04586c1c00660ebca927b8e2da631683bcd6307ae3a5b28050e1c3181d3bdb46",
            "0x352907aac1282f7af059db759abdc69897eedc7d", "ed04a0f44123c18a59a9e7dc97c897a4da8f9d3556f6e77ff5fbbe2f781718e3",
            "0x135190b8a52e5de2fbb23c2b6d1287e31a66353d", "6e20cbedd29cdfded32c29e6c78e5c47fb7240ca723fd7fdebf651c3676400b0",
            "0x96e74532e6271dc03648bf3299c6141097d6e995", "e1287946154f1d9bf9ac2b534c708c112baadad9fb3bee539109921015df2588",
            "0x4ac868a11ade1e6be329e1600a8720ca838e1a2b", "be77ed3e6a0c799510415eb536086bea107dd2f8e7865a48a597859cc7da35e3",
            "0x46c5f767be88737111628126ab2b1dfcda074bef", "1a2cc627310ecfe56dcc8718fd1ddfcf9ac84949d46e3ffdbf07a2fce35f1b4c",
            "0xdc36e6d9ad35f5e8ef594ec91a3dd4baf9a14450", "78aefd3952411ee07ff85f47b1ed8590434f5dfbc5abaf5899ce490b124ae406",
            "0xbff4c391ddafe9fb6ad7806124c63c836b157c8d", "1dc5657546cdf4fa9986dc266b6b0efcbf8e0152619af4437507ead6d0be8361",
            "0x0eb1d14a594a2e9333090d989146a778701d7fbd", "7c1d6ae0ed4cbe19e53f08f2f4b58cb0c0f70f0bbea5fb89bdfce529ad3488ec",
            "0xcd7046339c2c925a474186f9be8b241204fbdcb5", "b21ddf7fff2e2f909e30d2e8066c5d7b22caa2f5dd6d3e7ab4d158c48fb022da",
            "0xeeecf39febf81fbe8ca7576a4837496083def52b", "168d85c729b74650ad5d998ad15f75b9c760bf6441afb2025e29acc21b47a0d4",
            "0x7e7ab828ec9726c055946ad9f4743f990ff83f28", "ce087dd2a3d2ee82240fb174447ddebcfc7d4c570ea28f245e5171c3e3d1bb1a",
            "0xee025f91bb0fe198d8387e4a92cfe8f5788bdd21", "01df015aa9b012e6cea13be315059a18e58a9d850a2bdb702f6bbb785e4d4f07",
            "0x4f340b4e93ab9304dca5fed621023bc53c0a42d8", "9a2107c2035340f00f44e627a1835791d5521b849e1955f29c73660b09c91d59",
            "0xacfd958e7938b6624deaa1026df07f5b8849100f", "d48c40cbe2b9d3204e398738859b0d493e6a440e5da5957fc19b743f47b7fe6d",
            "0x5583e72b8cc87135a63f6c7e80a10a8ea08074ae", "6a1e7e8dfd47cb371624f6ac0f158c7598bcbcc0a82d81ae7e4074ce0a725aa6",
            "0x909e62871cf90de800493bbbe3a65b63f08f0fdc", "dcee1e32597f853315136d6c88b3304fb1f4fb52071c5ada4a24ef46371f4d67",
            "0xdf0ca9157fd448605d8c9ee02461aced6c415c4c", "6acbe019cba310bd3b5ed9ca2766fddc07364852f977119cee1ea20311c3fb13",
            "0xb372370e29589fa267681378e9a86be4ac2a5a2c", "1e91540647416f92a61cfb91dfdb3ed278cd2661a04109502b0c9af106d45200",
            "0xb9430f7424b983ac9f440575b97b612bc1a6fa2d", "fbbf64f894141f44ed7b12dc9ff60ec72f2277418b9efed3e42714a60485fdd7",
            "0xe3aee0959fa43b180c394df55ef5dad9e21b3e59", "976e328214c652b8cc50d46f172b0ae91560d0e590dc9ffd03e4b5d089db38d9",
            "0x0bc2572e53846ac6837f0150c7a070742b1db833", "50ef2c299018d828d702e5719f863faa2c7d148e74dcb96f7e4aa2485a0ecb56",
            "0x7d21078822ae778456f2dd876c05077b6970dbd9", "60c9d782309a32a85113f4ada6a8b1d68428bdbf186df2933cb019e1b84bce12",
            "0x737285dfd9807bd4f16ac97c99df3395a3d30eed", "9f63a33991261ad66dd8e269ecb51ace4cfe278eb6580d94e2591eae680bea05",
            "0x56fde5f9e986876fc0f4f626d19454ea62056ec2", "f1d36382de570f72ca2cfd671d957b81fc53f060f16de9c732b14dcfab501e03",
            "0xec2f1090e91e30aedc34f0947dfe87c1d6141e15", "cd746b18f0ee0d60fa36c0fdcbd791385cb4d683a61f4a41d84a7b59c4cfff4f",
            "0x67c9310d5142fd641d4e4d8b669f4b94e82eed44", "19e56881bf6610ddc9eb25b5bf5344f4032567e035a813d602be8ada0ba6ea7a",
            "0x0df529f8ca64de4b64ded1b20bfb5fcd3e326cc9", "32bde2f52b1423d39105e8301f09c72d35872fe15bbd9e8e9a1d98b52931aca1",
            "0xa0c72820f072d0608c717fb7d43f40203c0f352e", "7c5b95ebde4ea21f5f59da1dd5458d0bb3b3dfec4d7e48b8c3efe65157f5de24",
            "0x0aefa8370c75b1e55eaa82a9ce8daf72bb71c60a", "09d0e5d9a49714ed1f78fa2437fa1be5edb12942421b1316c5b280b106fa7ceb",
            "0x9f0ac37350c5ba893d8a82b3086a780cee4ac091", "a5ae4540bb6568d5977f8c697b728f472d10b8011c2a90f896f4478e8776fd23",
            "0xf88a0df67ef3208b2b7046612bf41590b83eb132", "a2ab3f3fa8146280ee2e38b469ec47ae89d2db6e9fcc9b2c90872020012b22e1",
            "0x41b1d5f762afe201806f7fcc5bd7f488b148d765", "721758fd3ac979035da1cb4cdcc2d4b94580b4f09c10de487ff7fec2fb6cffd2",
            "0x7a66b143fdbc904c1adbf1dde7f71abbb281f3e5", "4b59bf7cb2cb0705bd8bb09a58b117ff0b1626498bf0cdf0305452d0b32f6b12",
            "0xf111fb89c64d4acebe4125f4beb5183c40cfd9bc", "18d676a04704653176150c92986bd22e30e02e00959a29713796576fac34c3e8",
            "0xf1278c2b1a965cb44cb1311e7f3c4df843cbb6c1", "7d5d8f179bd7f239076ed5ce956b111ab4e08c669ee98bc2a0c3ab5106ef184f",
            "0xec11698e61dfd08e16bfb7b98ece369e7d730966", "a3bbd9f27fce046bf5653fd3b1050b0c31674a53bd38357e88b6b1fc777c74a6",
            "0x8d94597cbb3dbbf59492ae5662d8272a73de7e9c", "cc3660179df411c2527757b413e3e5f3b322e0ed0fc2178efb87f0de1fdc37bc",
            "0xf19abab1b3060633d87c73bf2a5756c609c18b40", "6ff5b8f31503c6fc6282ca47825c861478969a633b2fc41fadd96c4a98b9cfaa",
            "0x6ee7fb8468daa846500666681a6aee70225d7d16", "181914624e86c179ada6879afdf560dfdfb03c6cbefa874b8ca314c02ef4d33d",
            "0x7834fbc4c4a9982657bcb1ae2646f082f272ab51", "d087114d6f860b12031cd1567e2b6127e14fad8414396f0fe49c06408bb084e0",
            "0x3789fcd1eff705d45fcc43483bcdd7a248633263", "cb5ab0eaddc6a007fb121f677f6bf0917bc718fe4f73c5ca6ff0a603d831cdac",
            "0xd86b1880d2b10b84bd7fb3633aeea81d1d14ee03", "bda62febcfe0638f31c4788974042894bb4dbca5a7552393f945531ce6c8c412",
            "0x19d9265939f0501adbdc987a85478dcd6ede0f4e", "eaa20fdebfda75cd272e296a4639bdd729349be97f84e1f276a6b1354e339470",
            "0x3c8b8582687e1702f5cf95c7f89310d646f41b22", "1ffb0c56fa3109bfe3c5840e25f882cde467a75338621af54c680f21b84e411b",
            "0x4a26dcc1d8da9cf5b0f8257da2a184a74b000d29", "2d8f7d0de9da45fb8573f47f90f126a40085954c0f26fe20b57e89fe8ad996bc",
            "0x21058b600e4f1ed5f218fc37fd02ab7f2cba0eef", "42068f1449b59ee02e768b2bf9f50cdfaf611d9b5e7ee371eba7809fbb947760",
            "0xf6de746b805f3abeb59744ab122058e1678ec225", "8930d91f78faaa47f48f6182a2a2410121e70a06b77549f772c4a1fadbf87b5d",
            "0x85f314fe78c9c28eecd10e5769092b3e754b3848", "4c391f339dde7efe7a83d7782c55b7e48430c957101c36850618e2bfc5a7ff08",
            "0xca729179c4811eb811a90e3e5c0d238dd0bb65be", "994774ec5fbfe1bc3b1b15660f04dc79c54904e3490bcd9c6586fc70e1af119e",
            "0xe026dd58387e3bbd542e849847f803aa0699a360", "3ddcd25c8c12eb05acb5ebf21e763d676de596e2ae1f299260e6ef646fd83082",
            "0xe1c4bfa9a4ce6096868c190fc5915094257609ab", "5ca285dc3004d239d5617a9c33c6fdef33e2af07620a1b56e56a24cd473c8f7c",
            "0x2e961be0fea0a63d08341107372c51f0a4d912c3", "0f7306a4e0a1a6beeea004a5fbf236d5d0f849670373dcba662171555958c2b5",
            "0x7c98f73cb8e5c6705fcdb88c333bb7d4ba6553e2", "eed3d35706232a582fbee9221c2da205acf542484ebf366491e4d9f4efd713bb",
            "0xd0ceb77f65b6433c91383588a6cd220bf50856ff", "b1b114694434b494ebb1c1ad679f1f6617c6aeeca2a9a184e17195f70122ed67",
            "0xe0e84b33abd26cf5e1862fb82c53aae105b38e80", "7b6192daf63453f48a65cd77fc6095b14173051cad74dab09481eb1b3e849538",
            "0xb468ec44a683211294e3f7c484c6d85e1ef641f8", "4dd8920a6a0ae57b905b9a8c65ce3e51cd6c27766b5c3b8b4882cdbc7d0fddb7",
            "0x382031fe75c5226ab433e66ab87ac03c0863f423", "6bfd2874094f29d6820b1f218f5155bed538068e34129287a0f170aebf9b151d",
            "0x4f717d3d06af877b0e866594bd5bcbe3f264f2fb", "d665ea17fb603388cd469b147b56abb82fbbee57b2c589d76364ea6077a2231c",
            "0xf31fb0c6d8944fd5044791993d6983212da6fe56", "7b81c288a780de7e1b5aaa6051f6c355e615a22425ae943e5037fe3487061997",
            "0x8b2e13be0bd5ca4c36257a2cd0edea3bca8c727d", "1cb31542b26c51e98887cab594f80e7094d02a65885d3a47f2df0b55212ca069",
            "0xff3da6e4d5f4f273ea49cf054f80000f2853660b", "563e3e2515ffb4096afb19e36f4f491b771e0e88c806793090efb9697eaf9721",
            "0xa6181b674d66ea1c2557278e2b0f9c6164fa4a99", "622bdbefcdd68b68f089d71a2462a467fa351d414c34e8eab9f4d62ed99479fa",
            "0x0615627c9005b03a188f79a3adcbbe738267d1f5", "78a4d22384eccc6581029fe3871943f0cf10d28b15823abd8973e72523a7fee8",
            "0xf5df2f3ae1da9c2cea1b1965b90157d2e90bf984", "df4ab5e06f3096a6e30ee8de034938505fceeb7e3483b4dbf53a55f169c7dd00",
            "0x12ea93a5b0915abf15bff319253f5c6907d1098f", "0e86c1e5a630b48793b7e332a734d30d97a9c862217a31049d65ba7a3b4ec50b",
            "0x2fa668d17de92900417a593fcf63e9bfd1b8656b", "1eb15103e0c2bff4c61675ae45a23587cd400c631a95db9542d82dc5f11b213f",
            "0xc17178d01d32114cc1c40ec1062ba44e164315cf", "c0ce1c9bc6d2c4a41941419ef4680f4253fd1d443a62c698b6c0e90be0519716",
            "0x4fd96e5393d03b1ac0c79c52af407ccdf22a8ba0", "42ffdb8f943ab66ad7bf15c954cc4e5d418c141391e399bc34795823a1e30805",
            "0x6d6eb33c4180fa5811e62d5004ec8a8cd72a9fee", "e5887d8a0c87417b9586065933177e25feef6f0fdfbd82ea0e48b18a3a1b1db4",
            "0x45d43d2f7cd6cff8491a984d23ee053a8325fbb6", "94eb95bb11927b9e3d81eebc702eb80cad61ad7a1836c90c978dc079f5d0fc78",
            "0x0fae208c92677e1747abcb831e196f833ff2c133", "466e3631480fa70cd97751412cce7cba215d152f56c9d0d665efcc25d49fd06b",
            "0x2a85b407a57c7a679c1720224aac05f3fe81d801", "fe3abc32f7351bd37dde189a280a9a0c0a2b28b70ca09956216cebd8a2fe55d4",
            "0x8a04750e605bc60e38792c14c3a4d6666f5bc3c7", "3902fa4fbffb7889a60779a94adc13fbd4361054851681eef93004d2f5a0679c",
            "0x88f7165fd1aff2f21617d1b1cf0faa73ba9c6e43", "5a6f223639a80a0d9c8c77134007790b0e379d52991dbfc8dce45e7f55d01a1d",
            "0xb4fbf23569013ce06ad84a0e7f3f4acf5ad3ccc5", "c0f6547f95e4d492ed42fca6e670bf8a892dc476d22e4468756903793c08ee08",
            "0xadb3d7c014c458b5d79f307aaca2227ba22c8c13", "bcad1d7d8ff6ddf4064a051401f9f54b20528f009a80a807a691fa127abe0632",
            "0x21840e3fe76152d7b3c74a8f026799f7b8fd2b20", "4dcea269387e8036271899c78d9431a8874120ac3d16ae5b9f1fdc674616209b",
            "0x6068592945d71eea738a5e7a538ca34a9cf019ac", "a9771851ef13c7af7b375e29ea38059664f4e23d9c534b2273ca3cf01cc63e67",
            "0xdc81b057ee06c4bfa829cb21a452474f8a696871", "6e1facff86d44bbf084805fa71b6c812a995e209e144badd6d2b6810b6e12e75",
            "0xe6876069bbb884ee54c1ec9645d76e90eed8d1bc", "fd889a057ac70b8762c511daa13ca3bfb45e28726b9d0ab60caf588eef24d2de",
            "0x121b143c8821c57981111bac5bf37e566a50a40f", "abd46bd4f0b3b7b3e89c47dcc7174bc5ac6c7756abd04ac1bec634d4cc0fa442",
            "0xd6e85b9de04cbe5b6c4aecaf14389e7aa4e8c717", "22224df0df702bde42b6fb6edf906c4f9a3b8b379a051abf5a179ffc8dffcc5e",
            "0xd078c4aeb403ba97e3ba64f7c9be317bfdc8e287", "bd4736766ed0114c9217181c8bc39b055195ad4ad36e5b7cea67268bcf578f2a",
            "0x4d63a96fb5e3253bb205f3a0bf64e53ff5d2a208", "ad9249e0413d7a9b411491319f0e7cfcae1823cedb5808d2d950057f860b7552",
            "0x72f489c95760e9711a4519ceb381a504c044f2de", "61c25e41e7db8ad6a71e94718fa26691261876dffa638b0f3b83ac9ce9bf0c21",
            "0xd63f8c3c45fe3f1b4fa2fe84878a9b86ccdb5488", "539c75dc3e2c8925b9b81b104acf6849f5ee0742d6ffa304e1083e0dfbc8da24",
            "0x2add7f4898b12a5de989d059dbfe73046ce4d5da", "4accf2b69336973da58b95b6cd4139d03dafe8f03b3ef7952a1849ed23b29d2b",
            "0x65baa69f4b0c9a26c12fda4285e51719f9fd659c", "ca26357d0cd4aefcac931e17f1775030140e86654a1fbf5371510fc0b24cad39",
            "0x1e68eaf9558b17b73175f39412b907d76de09228", "d5ffc6fb6a206a2b40f6c12973b9b320916e53e66960090021b0c60e21e84cec",
            "0x51f0663745b8929aa6ccf4d9d03a36dacc90e6bf", "437e9dda4321912d1926a3977961ef9b89601296cc46a4cb977b776bcb6bc4f6",
            "0x661d5fe6bf8075f8235a927a694f1006d615ab0f", "0a34f48e5bcecad2f5f92251915cf08ab2e14aa02fe44e72a8352633d3f52ac5",
            "0x4b83f96df7b4bdb8d188d8785937c8578be9ff33", "a591c0f330e0172c99fcc0c6e17ef0fd6d42d87f2c4b5fc3a4480eb571b391d9",
            "0x7c2a3bca106499a3ff5569ec6bf48838b26d0b17", "8849bcee4b86cf182baffef4ed1d368c2188f14eb7b5eb05cace363ece3a1435",
            "0x3f3143e78ac4b6967a0e5eabce2e22c42f05405c", "67c8c547c4f65e1a1223bbd200615868215d27c65b844d18db1f8f651a2c63da",
            "0x131ce4b18593431ad1ea0c190e0f9a2db669f2b5", "b8d786cecc534da6d8320f2caeaffc42fb89823800fb82a8bfcfc2031be04d54",
            "0x29f0e8e22890bfa2e25eb2832cc1867dfe001a24", "2f6ced92103532303d0b4fbb840771a949e28dea028b8edcef4fc7c467fc7f85",
            "0x1380a3c1af45c112bfab93f54328b249ec79f9d0", "adf3b13325bde48f4439c46db073d704ae82f588d077fa4a1c4fb1538b330d43",
            "0xca0d59850023de1c900a1082b5bedbc96f44180d", "13ec682096a27cdfd18f65782be6f8348ca19a881cf2f8aa78958825b9dcf505",
            "0x19cb36802c4ead7dbaa41bfcb877ab9b529f30ff", "f6b1f2411a557c8571d8f8822cf359ec0ce327ff53ae646b681246d93fbb1505",
            "0xa7ec4e35bc2569073598a3724176a4fda20db7bf", "aa45532739400cf7d13cbdbb08ef4146be92dfa283595fbaa42cae5a42ca16d2",
            "0x1e767fa701dcdf7b0915803d37005500839caa58", "2b5dfb43ee27405797cb7d65536a73d6db3d172f49c64e213d71ebcbbbf29f36",
            "0xef87075a86a47b70dce69e5af6f256f0363583d1", "43f33166704a7ef6cc3a5bb5a421b401829b509d94c792c531ca85b2633ebeb8",
            "0x0be02fe2b889dbcdd3c93c0fa9bef906f378556c", "d2e5e02426549da3af3ffe45791e537c292c3d1a020334d6016a65513867df80",
            "0xa98c9f0d77e424e4aa9f6de9543f927592bfe83b", "0cd2aaabcb0ef2cf38c8d6cc62ca1b46267b9533e6efedecc04c4bc108b8d032",
            "0xceb327b63573228ed186ef3e8d4723e6ff6948fb", "d44be880efa6a07019e79df450b75a86a62b314d4f2006a4ccf4e8d8b48596bb",
            "0x36172b51cd23eabec9e7368d1ffa91775a08f2ab", "d235ac66d27c5bced161e3ccaad55c37151314c3fee1aeb8ded6de7bab028a75",
            "0xfc62af7423eff0fecf7837dd8e1817eee7605f88", "0c81842714c8b875df5b787cdf9129485a76d038b12fef6a92d05a36ce5a60c5",
            "0xf01b2153662f2147882977bfc5c1f09443d19a6a", "ab4edc1d9e8d26a5c9526f14d8a5e3acf35d3ce322a3d97d1f99d1f5469ab7b6",
            "0x715bb4b55a74fce0b34e8df172d4a8884e045ae3", "54987c88ad9432c32ff858c8c56d3042265654c35bdf04ffb4acd6e90f54b601",
            "0x3618fbd3d67f3f8e7fb374de7b89b985d1504f5a", "a10ae6bd66e9df5dde36a5fb3d2ea510793f7b859afd9050fb6c650167e94490",
            "0x62655fb0b92a11584d409c8f5e03d3208c64d9f1", "f6c8b7d2eeb0ca4349ba07c02316f4315a77fad075ab78d92962a6b6f8379b20",
            "0xb84eac59b1c6fb26bd376245fe8c7f76186769d2", "e37ea163a4c44c1221dcabaa4fca41deba9ab5e346e27f814a25166a5aaf0323",
            "0x7d8ed389f91bc7a0be589fccb00ba3d06f030a3c", "6196cb4d377d595077d50b90a2ce2c44b00841da2374924addbcaf726ad7d7f6",
            "0xb2e311b830c4634f19e15645dbb2ea30d4cbe8d9", "0742cd8fe90a36db5046d96dccaa88130c30263b32d9da5c59ce1ab359fd755f",
            "0x6c64de31ba7fa45dc02d4d931a67b8f165e89f70", "d9dcbe37d2a6e4ec32732252f87828cd1409b2de44333bd1acce0ca8caad24f5",
            "0x1db184446f172acaf9cde53992673f4a7bee92c6", "2413d06eb468658d15ed0656ea470aeb9cbbbd34fd774871cd51a2140f9b866b",
            "0x76fe1a9cf51862c306f902f555bb49ab1ebdc37a", "818a6473f1fb6887efe04443e992aeaa4653cce746340e758d69358a026ef4cc",
            "0xcc0103f8894692c1758c8139cbf040cb0f0f4837", "5dec55199f331fae633b1bed0997a19f1a342e3c44acd526c877aa4d3f6a2af0",
            "0x0706bee8a0868812ca2f8511ab5f9d19d4568122", "eb912696ffe1650e1380ac0579a10272bf61f4dec7c421a8e52663258b5468b3",
            "0x1c1d466646cfdaa05a79a3cd761af9c59bfc0b2b", "dba260d37daba571f7ea447c553642b2b14caeafb81ea689cb6c6b9063addfe3",
            "0x542d5a351ed8f5e9beeda0fa3e1bcba7798bf5d7", "34e1a5ba185fcbb4151ab41ae7b559198546192b61f3724ba3cd5be49b21bec4",
            "0xdc4a39ebb74c4374cde4dee62d9f147e86fdfdc1", "20210401e7d98f88e29eec7bcdb8f02b0ae297bd3ae45a5203dbb796011b602b",
            "0xdb2520870a97b220a1c6cb7b276bd27f853fcd76", "6b7838330c5173b17ad340ab88ef9a4eeaa03565d7a9eb3289fdd5e3f40bf52c",
            "0xea300eaabc07016bf1c7b7a6bea93b143e37621d", "dd11f68774e8bd23c35b1147f0aef242b29e2c27cd7c5f58b0b202891e469d7f",
            "0x9b0c75aa8c87f08bd13335a6cd63a2f9418ace0b", "8eed7d97659084d19becd9a096f919117003490322e5478fd962a768441706f4",
            "0x3d8f521440079cabd570e41db1cda73f04ae7080", "d93977d3eec17153ad817ca1645625823c56ff0985f81e94c8ac801dd3e5ec1a",
            "0xb74b6f112a4b2204898c4fd5e1c79a829a6d4bb9", "dc38e0b78f365a885b048e610d98d7da3c8b26070968e8d23ecf66ed13ee3dd4",
            "0x2db7881e08b1fd342414e4c950de8bec1ca974db", "f3b560f9603866adc761c60dbb09804b8ffbe21bb5035a9ed6476001d1030e9c",
            "0x7893ad1a7bdc141da8db05d590f13b0cfa620e3d", "ad7d575547b6d145622029c3abc623dd86d3be49f02ff8f37856b05e523a5b46",
            "0x090a79a032a95d37c7396a3c349932c84b654adf", "f6d864b615fc869e6fa2f2620a4760e789412035b8dc3f16c26b52296c6c660e",
            "0xe15a1164a64edd82c2c9c9452f6e0bb441e9ba45", "3c1d19388d018b951f1a69ed005b24a8d42d04556a3c4db0fbb11766733e57c2",
            "0x266702583aedba50c8bbff1799aaf7c29787757e", "cedf57a44cf4d0e5d2b59425a40bd818895cc7610c676568212a70e889853031",
            "0x27f0023cd67ce0bc5e47660326b6c707bdbf387d", "bbb84e4b9f751d84f02527557652de0f0870369f108a74bf2c9b9ed54ee866ff",
            "0x7d4b9c7c70068a46a3110bb7452a7a874a23027d", "87355571ab3f375cc27bc130253789e847f64f7b5b71de8aff0bbd67e4ec91f3",
            "0x0af547fae1f6506e5ae589917a8e2364a9abe4b9", "d9c6c040f4e1cd065049e98bc62a87baa47853240b968c1b59ab495699693213",
            "0x06b6ba0e331b852fafc29741164aaf65d36071af", "5ed5bf01b3a295a0c298867ede620460842954d38568610389e06c4501e187c6",
            "0xf7c333b8ebfd024d58a8b617ffea591ea7698a54", "923e61ef86cbf63f81cb3b651e896849fa8f617bf605393763844501861f37b1",
            "0xba62f49939670f07d25bc45416d43d2e8b2872fe", "2a5ba34194f97acbb7c73bebea9b005d23aa959879f613f6c759265d2e3bb411",
            "0x5564db99dcff022e500d4f470fe14302982c7e83", "fdd116dea33e2e4154f9869634c1d5268fde35ea927cc7314fa6e4ac7bdd9e62",
            "0x09143ba26927bf4ab55af31a5576b7e8470c6340", "94d39ed21716b5f497d9ffe35f8bbd8084235cd4b514fcd086fe44a834f54070",
            "0xda6a9ffb923e27a807b823985d657c292929d9f7", "ea2f8373a0c0f2777f75fa46dad77098d6fb7041bdc21b3617306cbd85dc1eee",
            "0x6bea21e91c3bac32e355d26d0480e62c3eb6e8d5", "bd70d92719952917f4f94738cfa56ee247b7149411475b6f3fe57cddb62ed553",
            "0x7bcd57a6900ba46b5a2452ba14397ddd1907dbd8", "fd2dcd88029847b247f10d6b7ff11b5c998f6b0e16d8d72cd56c85c3bcdf7f29",
            "0xe557f012c04ecb96dba38a04ceaacc84e8aa51b1", "c40ae5b81b3f74d4dedf11732451c19adaac38805bd3439e851dc3900c2e8177",
            "0x6a5a0b3feee4314aa041f2179ce4cefb11a266c8", "bf52cf2f9d7df3b0e8ed9a936ec79a9016fdaf570b68e82a48e2c1258d6992b4",
            "0x00497ed0e522cf930ea541ee6e9da6831f87bf11", "95e50f2f7610267ac24f7ced97b2639b78d4edd8014e43a0c6a301c85e1177e1",
            "0x7ad2a44f83f9e729f9f866644400666f9498c3d2", "4cd57ede7e979d985c8609a2b6bb366e8e98df405a4c0143d7b6d7b8fee6553d",
            "0x96976fe26b7881deac9dfeb44a458dff34c3f8fc", "5f78edf4b47486861a442d1840655df9d96010427d053e20b11544a4ded4f4f1",
            "0x934d16650a36fbc1f69252f27a7ff5ac0546c81c", "1b6df405e3ad02c88bc921a168f722cfc3a69600e5c5057a58d154c8cedb9492",
            "0x217140e70081f4cbc21197e6ba5def414f35f5de", "3735a7841c3ceb789a1e790d2f90e1d22f38417339338ccd860666dca7a80c8e",
            "0x8a394e424bf5339f7a002418abb284b79666941b", "b07dfbfee258f1200e86742bb8e477d271a656489809d1bc07705b336ab0382c",
            "0x240c7b684aad4f271051b28a122a3bdfbc9db267", "6c006c6e95d9953e77dc7e7ece6724d217700e6328119175b3ce13fefa30375c",
            "0x848435c31e81bed6fa082ea74ff34d0b9115152f", "c4ed8820bd012187b7561a8ec1795cf6d8b5e2a7b5b6d2c7fac95138b8aa5477",
            "0x7b8140cfa81dbea74beb9204200289b7906d115e", "a692ed1decb97993cdeb5364ad67b6e0c98e9033312d3b58ccc7944395d163aa",
            "0xeaa5f473333a66292c8c8f424c21cd3a10c35d95", "48abe288a6e99c4986ab2d74fcaf313abca91ad6841f0c1fc30afc908cea66da",
            "0xa74de0e2879c82799fd924df6ac371d04f73cb4c", "6d2737c14f397a812ac16091ea55a478e445b16492c6f472aef44d6482ba1386",
            "0x43aae18f1ab0660edcbdb0be19027b746db7c0d6", "abdca199ab379cb3a6547a2df29c909d2b83d57b71cbf48ddc4afa9887dbd272",
            "0x458c2fc01ee8a83310f0bd88e184d52c1bf8570e", "9d726ba9a65b474ed6eecf05f79755199922bca1fe3ed9c2e73ebe42666d2d0c",
            "0xcb93e657c1e2478054a374247126241cfe6ad803", "1f03a1be46d5a11d7cb88190cf8145c250870b02c44ca6fa046350736c86b4f2",
            "0x5bd0f6171882d9bfbf41b5cb3f32befd897a9886", "cebb3076915f2fc6667b74c0cfce5d5477e6ca6a5cb009ab745ec187e3ec44e8",
            "0x09cef1bde1b2d820e72b2447c7ca87beb7943dc0", "957781c705095e0d3d60f49750ff35897f4b06bc4bae005a3251d74c390a14f1",
            "0x2faac9be8b81bb5625ca1a719d57337bb1de1bf9", "d0def06604feee61ca416c40705df4ce6be400d516751a08f825a1576d602faa",
            "0x434207c2feb20bd31d1a45d6dd6436c877cd43ff", "0e5e4b613aaf46b4017ed129ede285444b98af024ac4bdcb715ba9f6e1380247",
            "0x6012ba8d5230f156d385ac7f08205234a134582a", "545d1efda3d2a527e54867210cb7edb67825f7978e606f95616017801329b37c",
            "0x7400f78a78c0400e79a7c5a2e57f2f97d55e4d04", "2964b107b8b8635ddcfb7eb7c1c947763466763e160aa7b3eb01ad6ec46099de",
            "0xdf45819d95ce5a4b353bb7262fa75f22fcb4e402", "a16c259ba325ead98bc04b68134a143e04d6eaabf6fd4ab6346e1227582d7dc1",
            "0xe122c02fee4288a2d368709236ccc8836482863e", "1eada5c9a493f2e7309e7185f0f68e0b5b3028c5427459c4fd9b643ffcbe723f",
            "0x1e6878919f5792505085ee268c0e0147c915be7b", "71471d2ff13a4e245dfa907b7c276b1e7ddd02a5bc2583ddea3c224fe29e8de8",
            "0xfa2629744f0051dab1a3f3c647231b1cc1680bea", "b81fc4667679ea00db39a97ca7f737684884de8ae21ea07cde46295c8e8a62fc",
            "0xff7742d40c18ad5a94211eeb9599c92f9164e551", "6863a53153902b5879060a8bd09c6490230b6a00c9112d2e28e10a966d3cbf32",
            "0x7f0f05ab875d66b625240cbdf7abc0b6b2e1bc66", "c8a49343158bf82f64c786485253fec23de801518aa440fcdf899355508ed5d2",
            "0x73b4b43f12bf0686bd37fbefc07f6296c44e2510", "a7c82bc6066537713a1bdc266a81ba8b7c1ea481a899257251c25a20ea149b3f",
            "0x813ae7e17b36807fecaf470ac4f51bdfeb617393", "c5fe8c9cb43c9c1e2464e7372c39068d92e53424f07efff2f6548d7fe3b57476",
            "0xbc316c3ba393dfe8bfe978f04501e9a170c99a51", "d211cfc664fbce1c31bbef5d3f2352dc733b1ee88c90f3837797d08a86f8b5eb",
            "0xc9ff632dfade041378e4fe8f615a4ea9cfd1f37c", "dae822e2c66d700f6a3ccaba9fbc6942fd50e71097d25a9741a5189da30f930c",
            "0x7a68304e2a2b81a87b36d58fde976a2457ed3874", "15495761465b4e957899715bd5e1d0e121ffcc5d111cfc452f60a8f4f5836c73",
            "0xc8276b518926e632b7e27697ef242a7beba38d79", "213aabcfac3247b12eee9396017be5bf59f63484df70d36fd29dacc599d0d829",
            "0x66cf48957f911fcd606742b3ac9fe5251a2263c6", "df2f0404ceefc8f2618ea25926e47d482fb72d2ea8ed1a494b46d13e9f37dec5",
            "0x7abf84659544d65d75c6e5064322aa8d48a02e37", "6954cc6cc1c9cf9997c1e55ace6e93ec4b2d5dea1c8075d9d33a5f8d487d46b3",
            "0x101433f0259b2f55821ff25cc545c1f483b92bf8", "0ccb1d2dcb611f10f06668759dec14885c78b7c80bc56fef6b9ab5c80dac72a7",
            "0xbaa084a4b2338a410e8a444460b160c5e577304b", "8596db362cb90f4a23ae8ba23316fda84b488e7342b8d1e823b0ed9a686d0911",
            "0x44173147e48a1e24d1655363f4e2596e84657493", "86d2a2594d37c7c78b8fd6a97d51c83a8bd66c63143825debf031204b2323a11",
            "0x40eff5ed89240e7336c9f83bcbb1a3f61913a222", "530deb66e01fdcd42ab40fe998237370cc6fc872e75c7d5d05f2e554965e642d",
            "0x20901df3c0ecd692299c46998c6446a9ab2425f1", "793a11e785600da6b74454c2bdd73691475aab268f3abafdd135bb335857863d",
            "0x7be0de53fd3d5163438927336ff0922b0af6aaf2", "7b67395ab8d6d40f4294f37e18b62181d982c5243aae92c055f97ec4a8fd706d",
            "0xb8403e972ba5db527c1e1d35f7dd6790069f1eab", "b9f2a9a665fc0f26dff594a39f063f756230a1650101bb267046383fa348ff80",
            "0x30d708ea63052a644722b3b8998f00fbaafbb184", "5125876de0ee05f773546bfc9a10baef2904d4e183ddac7efe1abd41519a47cd",
            "0xfcb1ff7d8c2cf5b9f3ec3c04fea69e3545a38383", "565a850b8916ec90436a20204718aa77dd393c3ba223d4f1af458ac6b4db6a29",
            "0xa88a1723b1b0cdbf0817d6a8c6cf44164c75179d", "cdf5bd4005003882da54ed52f483ff75dd854b197083786049beeb240d397461",
            "0xdd77f8eaaaeb062d81640fb11818d8b06a2b9497", "2a3ee8d54e7afd39c519bbb5eeae4818c98fdbf61446c13701ae99ad77cad56e",
            "0xc3265e266d4bcd440cade154a425334a020c99f2", "371989e60f2aeb046844d49b91a9c38820c31bae73a594e8551c7884cc3ea659",
            "0xe839e2e6b912d626a5a50db7594fa9020e8d8626", "9b051c767de1a5095b7ffdec292cc945633ca18421896552596d6530d7efeae3",
            "0x2236e52fa9b2911127198c80045c710974d45855", "ad9eae6ab09a1a0d09b3d0c23951f77c0021c521eaab80db23d027b2e4c46c35",
            "0x85c69b7182682fcf2c3f4022382f6e5275a70610", "42c26f442672a726dfe27bc99ac4d42cc82ae1801181c2dda203960a8498894d",
            "0xdd15f6ce62e6e6fe1e561f29b7dfb64f08cbe84e", "80e8a9a3248ad56a37c76ba8f94d98dc25e51734d0721e731e7ad187e4312eca",
            "0xe0da2dc62631a4b542005f0fcf432f31a2aa0fb6", "b168bc6390e174d8b734079501011369de5ea85b67483379d77d93f0e0901ff8",
            "0xb5cac9151bf21a32cbf2192b8560c9fe3bab8e6d", "6d24595a6945ed687c13b842c729273aa7ba309c5d2308da472c574138aaea24",
            "0x434654d49553689466ad40a19b5a4f1db10170d2", "14b41b7fe893c0732e2cf8a5eb36a506a8320da4bf7e13f3ecb422d7fd0cb39f",
            "0x459e99c9ca64cb515bdc82c1928d869bfd0d7530", "8dd86d20dd4cb1cb7abbfea7f986d686158b4754c2321d9f4bdc92ce8bb3a705",
            "0xdd26c043d2af82f9482031718e896355ee1678bb", "94acdfc6c43e619974c992193a6724c437ebbbfc6b1f11228e121e19e79b209f",
            "0x29efac4bb78b338e3ef5537a0be387848e61c750", "8506c8aec22cf77656c21fb6abce7b98a0d1ccd476488a61b009e08d77f7d88c",
            "0x95e57788f5e9ab10c2a06eb3fcd9f63e9acf921f", "f1f71e08361eacc236a8c8dc83a7a5568f77e38b7ac8e0ab272cb588c7e70941",
            "0x0003860a745c6624856c1b1842758ade08b5c133", "6f330b1813da8fcb2d2e95239c2b643805b6e3cec64fc97cc521e286d43b1e3b",
            "0x02170f1691fcf7d418830b0ec64d6392b70de970", "63eaeedad33e00ba51350bb26a4278f27f9238ddc5d86474ad7f5b7603f92c2a",
            "0x1c6757c5b991279e66725e1d5d8e0d32441559fa", "5920a31eb04061ae81a9f74ed45bd4364ebfbe63d498e2a1bd59f2b8bb5aa3fc",
            "0x370cface9e296de2ab204c4b90f0ede6004d9264", "76379497cc32b1962e9358051596da468cab81f34d1e0d15a58fa365a59f6d7e",
            "0x5f5579f9f69ce9757a8212f4a07b2224af902d90", "595de590d7112acc33d84518e3468accd9da527ce12e732be209fc1a12b13b17",
            "0x69053130c388947a7696612bacb8386860978daa", "ac9ecfd23949ef8eca63ce7c13bc47fb0443bac12d7308fe47e2f7940b88e33f",
            "0x0a76e56456d02ffb86fcf11b919f20ee5ce96521", "03937a3b4ca271d56d81c5eae2c1de2ce1c4465c5436f204da71aa6119d8245e",
            "0x1f50217c7116a39ed38f20f6f393e254a6ce24a6", "1f5dcd513dda09fd48ffa55f08f55f78bdff24ed64a6381329282587bc014103",
            "0x159823aaf06bc6f5d04ee5538ba9828cd52501a5", "244051ff6fe677eb8683269bd86fe344a49fcb0a47dd076e7179068d48a3333e",
            "0x0efc540012506b9ed681064a1c6f79c4b29cd158", "d2f41aea0d1d00f86e56c485e42e2d893941bf9cc4f7182971a0667541cbfe09",
            "0x730e64e1231c2b7657f360e40f51c6a07f2ba09b", "a4d29b0f61d5348179b523b7f15d10ebe7f3cbc950a17302bc0555946da8c3f7",
            "0x3cdbbc340fcb3abfae4b878fad3570f57c26a246", "11aeeb2e640c9641bdb635cdd5262cbfeeb6f64a5ce607c90ac97a87e9ba2ea1",
            "0x983b043ba31ee845fd99414d90a176745168e7a3", "7ec493ea1219bcadef2828a4d7042f5255f9da24d62ee4a5b7810a1369acbb24",
            "0x481d7aa0fa466e658f6b03c31aaeae168a0127dd", "0bfa03ee1608c6de07b3bf5e7b509d5696cc8c9190e6246de2efc5abc198f128",
            "0xb210e141731626cd934302bdc813afe29715cc76", "390a0ec46bfb46b20f53d1fef1681af42dbc024ce160af82341f81719ef76a9f",
            "0xa4c0269444bf9f701e7e2cc13263cb680a7abe53", "979dead51e9cb2ff0ba2bd79e82aab3df5298b30815b36736c578357bd841a2f",
            "0x7dfa4758ff614b4eb447a1a19571d7f4b287054c", "ba4f0df7eb846fd7ea6095c5dbff8992127464d7bf647f766e1112af06a577d6",
            "0xc295f16fd65ee979b1958182a9a90581db4f2079", "8cdb19a9b3b32951d4c821fc9e9bd3c1b46e795d8fb8227928a23f2b3d87dd3e",
            "0xd0ba381323703010f88f8d2c8822923b01d25144", "94f71cefe3a137fc188317b73564d5de4ef8a0d9e7362720a7302eb8be1a2914",
            "0xc2011ad8bfc2120943979c81829c3b7c7eaf8a2e", "ee957c1383f9755ee4e66a61d5b1c6e7317dfc148fbb2d1c757775f313eb3c98",
            "0x08008f7755ff5e55c7fce20e06a274eb29a88b46", "c5bb3c056a45bad17198389046cd7ae3ddd61cb4afac5f9280c4b18bf3980d37",
            "0x91dab1a3dd61fa7d6bde11dda0e8b95134046056", "ed739d1d591eaa475ae0a8867769257307ac5151b3fe726a89fe5398dbebf0cd",
            "0x096a0adda2fa6c314b76c79cb1fff372fe8e038c", "1394d501b99d44b02dafb4bd8273ab85458556514ffa5add5c13e2275d37e3f1",
            "0xa40e7416dcd7e5a0448e5a550813311299515fda", "93285be91a4be02797452d1dd37e202c298ce05157a37df97b062aaae6a2927f",
            "0x329144dfbd1dfe9203703c6d2771a8e2473a8330", "85d636ceb4fa8d45bcc0fb917a61a6114bc9f7943530b10c32712ba100ca8353",
            "0x1247c6c788dbaeac889d45d1c1b8966cd1df5ba7", "7e5f9417571af00d11cb9c74c997b5015b5491a43140c42825868851d934c65f",
            "0x53e96ccf06213f10b3aea4b24caafd276b0455e8", "3c014505a41363f9ba083ff8f3657f909be06042a00599ee91d99ecafaf7bf3c",
            "0x3d421ddd8436ec7ce99f400f3e1eb779c2ec2f04", "ac353b10ffbf0b120116f59a5dbf50d76288d02401fcd2ea1b7d5684d1edef22",
            "0xb584ac141f6836738f1f31f41692d9c5d8affa53", "0697cca08630be6d682825cfa4e4bb58a6517c0fb637cd0c62c615b8511a9ab5",
            "0xc975284982ce85ff9d2e44b5e21faadff8ad809e", "0eb5deb9229e92659045de9d0ef6257f90572c009f7f434eb6791a668f3dc077",
            "0xe6f03893f4e700719aaab47671c50d567c9a2734", "73910ab82f71a8bd590e7f199fda83609b6426f15cfedbff80430480ae8ec453",
            "0x65a6d7ece336cea71f7d29d5abc0cf2de5ddede9", "8dd9b8e40783726a9f3bc4fba795ff82a20c58800e1723e23824f39476b10a86",
            "0x7b6d6d9668d7e66ce7ecf852e3ee27da544adacc", "b37434ebdd5b6b07cdfc0d52d4cde162b85d44797e590a18315a103b7f1e92b9",
            "0x4bc4e61ee2c471fd0b730057cd673c662f755915", "a3009546604c3faddf23a25c2ce791f935c1cadaa9774536d78ad2258495d1f0",
            "0x19b8f1861f7f2c35f92595d99a241196d1c09cbc", "76d373f5240f8f3ec5b59d9575bbafc733f8bc6c452da0af4023bebcc774e095",
            "0x72b9493d5609731490196502cbeab36b02a4aaca", "01758e2d0e697f80d6934d97edec7f89db5b86203b908905fbaaf78c49926476",
            "0xead343c2b9354d96a21924d35c61d5df48f416ad", "6a56f4cf76691f999811f3c7dd0ce06d18a63f52ad885490f91a1ad11e9c5928",
            "0x6d322ccf484c66841864c9a9e738a73e121329b0", "7cb069ab9bbb66f38caa2a2b2d9dda706fa44831afcc80139aabf1b266ba35c2",
            "0x5cc3c4af81877b61e1775979495f080cba8c1a46", "7eacc838dbc209d031e51ebadfe018e7236b18da51f0bb2a9fcd32578841965d",
            "0x2b146d7e64a13baec1672e6b769e0c41a165116f", "1ae755c94ccc4ada63fe79edf19c1b3c312b09ecaa5a51c5c181512f0e6f0601",
            "0x5d85701ecd78db29960d8b4f4929e546ba959435", "e921adac960fc322dee7e98e0f591f5b9f7317ecae47220ad338b93eb2cab02a",
            "0x49777fd0da8da896beb2ab8fcd7ed2e09443860b", "e857033a2985a38ef2037f5384e04f1848ad1bf313e4119dfc61d8d9f530f0a4",
            "0x9fb9c35d60075c13a94c854600a40daff4ddf36b", "2855e70bd0f5d6ce35f56f777d1908da5291c14534f3e24afb424879bc92fad1",
            "0x3fb541e89f20d5f3a1c5a6e7d391b177f5e02f67", "f3175154b84fccd3d9248b293721aa432a298d25b059610d2836ba681d67b3ba",
            "0xd283484ab924ea2b75178cb3ac60634a7a6d8edd", "3f96d93d5049ca89fad39fe181cc25b451efadf4fd29bbaa19738162b30d9ad3",
            "0x0e0ca21ea5afc3fefcb5638af26aec3f6a691e86", "410a258a170c4d0d4b835e9123f0cc2737a3aec50c621f28b3d426e39d7e0e4f",
            "0x1eba6332f76bc408d30fa60b5d6b8d99fb35f3f4", "e75d06c0c27121948cbaf34073f87e444857010df2d69b006e92277e7537bd4e",
            "0x64226724c1cdb06b797b95f49be578dd94ee1c50", "2322e265670e3c0b6386af2e3dcf29574bc9ec3301f078505346f3a6fa120943",
            "0xcb6a3e148b5804bb2b0b18e7988845d26318af24", "150498238540d35a75f097db7da9dea2608726aba89dfcd0d38ce3a2eb9727d0",
            "0xd2d5b3471bcb29eae1e66c652cfa87d20c206b67", "da17599b3b95c8ae47e93e56f4e4028576933344907deb2d6e6929ad8749eacb",
            "0x4711f5b753fe11327cb24f6e2cfb78c68c3c074d", "cd0ef15facd4c2e7f2fc04b80bf6589d054959fefeafb0407154f583f328bce6",
            "0x69afd5e1fabdec44a8356746ca9350a551ffbde1", "e9e1d34a9f23625da086c038dfbd320e538c1f860c3ef9494a7f50003f75c50f",
            "0x8631426e42e96050256f8f4582ed4fe1561171ca", "a37dd0b479d86a5795ccc29a7d03bd63c1a5cdf290810d67b158cf3e1c9cf730",
            "0xd3ec4e1a04a8c8d8b21062a42379310b5d751d40", "0eb907c2a0447737b2f354832ebb6761d0438b576de49ed19158b1f9f534bdb4",
            "0xb4c57cf30fadc7002a1c232a3b5162de53436bd8", "b00c9f9e9646f071c99e447c8f8c1433bd2dc64fe2cbb4644d2ba17dbff75aca",
            "0x5d8a984f73465bb779dbc67b7cee0b5f40102f76", "b21d52fde5244728645c2e07d03a8794b11e6885c41e9dc732e21a0b92a3c5a9",
            "0x8628725e6bd7f1bd046ba72ba0cc622f67cb709f", "7409d5974bcd2055d5535561d45f5f403b1498e9dcef4fd5d34b73e8126d142c",
            "0xb730540ad8677c0588c22b28bc07dc3dffae0701", "c0b3bd242fb1098be906c96f2889c3c2f01c5a7157df702232cf1e8f8535d624",
            "0x626f93d8bce4512cbb297f1996fd5b7dd82915bc", "8283ff192f2b8f7142b51d1c236f6bf949b9a5353cb501c43fcd08340a8ed811",
            "0xaa07a35680c40a45362fe27d403a31d324ae5b86", "dd878047d3fc2031d946b2374a86b49c1807080a71088b7475990c66cc1cec7f",
            "0x3e518b2020b24a9966001d740fd1a4a5d03fcc2e", "d9aff40134fa2a134c7250006e24d9f5bf7263792ad3aaeca417fcdf632ba5c4",
            "0xc11648ccc7cda6430f74a8f1ffac52e6b8524ef4", "3f8f77dc5ddac15bb5ebff0c7755c6ef4c608b414676e16f207792d0fc24594a",
            "0x79fc0f731e1407a9bd1f69df67931eea0e279c6b", "642fcfb5085edffd2a593bbbe3718c95b20635fe3daed60932b9e0374a78dcde",
            "0x2690ba3f89848964fddd8d3e34610538f694bc33", "9665b05fd8a587c54728db7ab1637ceeea7339f9f498e76b3073d7f1a00f8412",
            "0x410ef3723408c6f82872627aa1d84dae67c6f41d", "a7853cf97a1833af040d4157fde18cb83feedc02fe266417cd8d1829a61c444e",
            "0x21377c5dc496c064f9527520185da27cd478ceb2", "67aa13313d805b6b72ac16c0404c35cc4622dba60f70e79373fd5121d01a6ffd",
            "0xf38b3a12357ea6afb337471cfe22c658837e4a7f", "7569988d94d0dc4910de03d2b5e3c120fe7567a1b87afeaf23abd6146f110434",
            "0x14714ee184ed3723c96d7651aea0221282aa1a03", "3a7f79ea285b219bec24757701b11f3b0310f4e06f594c0bbd0eba4ea0637bc9",
            "0x180f7ee028fc743ee563256809182ec04c2fe78b", "3cb0bf79f8e7425494cc9735c716583cac05df47c802c201d2703bb9fd8c5a65",
            "0xd96e9e54ccebd96a8da14328180cd2c09387a064", "cd022a3ed8ce71b7d1a3f3bbc08ffc9d17243e16088d4739c0a3a20427fe7b5d",
            "0xff44af01d71134b867a912aa292f0c3415bdf502", "12459a678cf807d41cd6e43f21f923ed3ea23226917c01559a028bc4fd124f9b",
            "0xdf2eaaf3441308d6dffe7415621f688dfabf0596", "29a93b82d4bf7b1493ba0504917a44d46977cab8c3c3a86d0816efba775c08e8",
            "0xcc2a58613e2da931621773d643105f862f72cfd1", "f8d541f52f3d56623e71ec89c29aeaf1efbd3bb4d0c2b27e80adedb0a97c7d72",
            "0x2d3f3d43bf15f07ebf9be3c7ea61aad873a1ea65", "fcfcf996c833879c14e08e8cd437a8b5827f48a93ee8775eeaf2e381d1ed64f7",
            "0xd35d01a1ffcfc3669e8fc2286b9faf5be6bfb973", "f852379d341d1abe7a6094e4a2777238771af290f6c79c2a84191d65410128d1",
            "0x41fe0a6dc5b6f227d804655a70383caff38055cd", "74609fd9f064ba51fcf1c2a27a83f8c9fbfe00825e5341986a3b3242e3dcb48b",
            "0x515df2997710b4c429b2306e6e440947a718e6f7", "a9783d658f5ab0b13d21711649ec27cccf744992c7201ad4ba756f5fadab6360",
            "0xd9a93b4c881a1bc277d999341c98ab8a8c6dc3f3", "0a2da515f02e2142cce78aa554f51100d269ae340edfe5846a2b67a1034f1577",
            "0xd2dc68d177bf8b0bfc9f6b9ab592f95ea45292de", "1b3ff9f679681062fa6071dce9ebee1f0d272209d448b22fd343726a89dfacd2",
            "0x30d9dbe890790c0e144e8dc8dfa840f97d467740", "1823c717c8494adf51b6ea3ad633a9c7e3ec89bd539a5cbb6518837050953e24",
            "0x03644e83808bfef6d79959fb25905ff0a3491cdb", "cc07e00d265fb82c4ec5cb56d9abcf634a17915e87279667a3c2d5e0127f0115",
            "0xc79dca120014e330431304d4c6cbd65d8d7835d8", "09757cad32314c88b49bab9dd056b6f259cd33f85abdc9c9723478629886ca9d",
            "0x89e20e3b88892195207ddee0c67bc9f08fca2c52", "a08fcd90e930bc31244ba945356ff433a2e71b0556704e2a3f5c7c5ddcdc97e2",
            "0xa02be67c298ccd399be738d72af29ee376e76b23", "ef369a8eebe8fff1b4fe8ff51853554d05b96436ee230acb0071aed105f4cc72",
            "0x363ad43caabab1a236e30c559df1a34097d4a487", "198ab7fbfcda38130a8a2514187292419944a4ba581d68fbae29156b37bff951",
            "0xbe87dce2f8739d6be17a275cc34bb36b203de961", "17b3ab2202d97b40f0fdf01940f74ac33ef27aa6f1c212ed0e10503855faeacc",
            "0x1df8e45bcf17ee27b5d568c4908b3f74c8aa04c8", "66b6f3ce9c3c84b978febd711847fac997587ea2348fce3234882920d632bbf8",
            "0xd268e2612c44a1ddd6d09d6dff720b6f7cf5d5c3", "b04886addf987db1fe4a3aa1cbf323a09e3489915eebc53d8b1b1d100fc0be8a",
            "0xa1158d96fc637e4960de5a402c86b6d27651188e", "7764b9759a3cb5787726b993b549ac7775e1d738a8de175b2b768fbf1387af19",
            "0x7ac92f0de653c229bab9d21ca4cc1147123d4b4e", "0522cd603947773fa1b56e1957fee10f686a33366785670fbafb1d8eac43a01f",
            "0x3b08be5a5dfba3a0caa30bef64faee388ebaf149", "c336236985753ca86678b1f6a69ba8cf500b9f300b133e9f882874a405f2f3d7",
            "0x1ed686c3ed89694af7adb823ee784fbb5dabcee9", "4fbd9e958b16c595192a974f74619f1413eb300cde307f2eba2769b7de75cddb",
            "0x1342f48c8cf0a7e02c060bb36da33cddd267f875", "fc76f6c8fe29b72ebdfc9129f728c59318a4c79edc95928b1e57afc377d4a60b",
            "0x8d646372a3c405a0ba14512f438b6b0ff40a800c", "2be2ed184ec0e2ca17f00339cebab0a74dbfdf8713a0427b9ec61422ed44084b",
            "0x5aa2a3d006bb34580bcf98849591e4281f3b8156", "24a57126e039b13747312af8b26858e8267dbdea3dbe8de6019c7c3005041266",
            "0x218f4a616566bdb36065f7ff1d72312e8ee78039", "9de8ae618ae6085f338a1d9932dbdf3853b2f347d2c79aab6af5e46f31f658dc",
            "0xc3f4056dbb694f6d88760e1f0a73fc5c6b0b9ac5", "1a05e11dd1ab0925b21cb13886ee04a8cdafd5efcbf9353d9565c97f22af01e1",
            "0x4153ba553de030f6f076b9f9f19cc3e103f44cd4", "3448fb705ef38ac3f4797896975b23f9a0bfd2791d0e2c089da3424a6726f02b",
            "0x86bb5c2454c3d3fcb5e74a38153ce882d9c9e43b", "789ccb4459152448f7ef769f9c8d710698ead558e14554d86d8defea2fb863db",
            "0xf43274d7f5b842809947a98205b5b682956dfd9f", "8525ee1e49c43f65f55679acf7af79570d0a11d51b9c0eb5f5d72794d61e6a61",
            "0xa0ef05dbc037008fe1512b70b8cca6d7f67ea48c", "db3c39bdf3a67bc27777af353eb26a23a86abf1d2497ffe2cdf7ae63e4ddf5cb",
            "0xebea7e32f51f7729fbdc0aba388fe75387e45eb3", "d7b314762f9174112ddc39cff380b373ae9d446ab252fb011046ca3ae3d98988",
            "0x83905805f8eeae01813c69583820349de6d6e34d", "8c7fb42b9f8c7dec7873cc3cb3647f50bb394cd4e4c5a2984321dc0995fb120a",
            "0xc91adb942ba9beeda04c98692c53f201dc79e578", "e6cedbb17379f544ee6402e7465c46e8a5901eb1ed3f8c26f489a98a6edf3735",
            "0xe20e2317d51a4fd396abf4be6cf03f2d5b66c15e", "d3e7b2794c9cdeeb69c2d44a34985574b4a4b542aa4d6a9e8e13676a7b119cfa",
            "0x09397c0c24de67a0f0f70720d468026720ab7ae2", "aad0cefb777955463307106f159dad30652fd6065f3fcd1fa0b8a9e00a2fe7bb",
            "0xbd65d8b76c54949484ab5a622d5f24801a86705f", "eedcdbac147bbf830acb9bbb5401e2236679d19d9a0fd9bf5c00bdc99bd952c4",
            "0x66c2b246733e99daa295a0ed39cd78aceb496166", "4fd4b4fa74af72910ac12e92316f3397c721ad73aa4c6fa180a2be646fef5419",
            "0xea124d27673328307122f4a43609216ccef504a4", "08c01d62a34e8dad0e41f51f35019e9b8102cf64a8e7675356266eb976b1f5f6",
            "0xd4e4fad64ab30e5184eb47c7683fe90fa76af1aa", "ad9930c23ed343146657b4e28693e5f2abecbc4473b102a53484d185551c851b",
            "0x3404dc396711f8ae0fdd7fd23721ceb6dce4eb8e", "8c6bec49c9305ada857ec8b292e1552d3f7696bd00b32e0a31b9fb41997130f1",
            "0x041156528a6e20a3b5495dc7c4738194c771c573", "462e5707ff126dbe71ece3df8cac5831a180a8eda09f99609a7b693f3d48c396",
            "0xf78a5380692576c1537ad0787f86d0df17402d2a", "cbe3c3baaa577f5665e665969342608ce87ca5040f5c0aaa166af975cefa78dd",
            "0x5cd260d8c303950bc6ecc5c916e379f18f838e9a", "2275f61e002b8964300d6bbdf009d0de385d707a6ee0ebda170d3e28dee99361",
            "0x8c2772b09d8a64604fa19e48d6fa36af8dc9a447", "116cc94bd99c356c388eaaff9d43ebbf8636c0cc743533406878176c09d1189e",
            "0xcdd90732ae7b700b1d3bfb60b067f0ed061264a6", "d24019fbef6f3081a06b35e954ba9c5469c046305ad7328102d94ad1adfefb73",
            "0x03ce18eae246cdbefd3317a6af8771f25dd6b293", "a1e8d0ffc4e54248235443cbf8a52364a7a71c5d409ed7d0beaebf1e35edea72",
            "0xb183eb49a85b88d652292d806b5bcc9ea3c3b353", "8f23be4902924bd4f541465504c26b48ed9b59a50dc6ea647a339d47707d8d8d",
            "0x383384fb4c6f047e4d4d408e2c91b071b2c4851d", "eaa13ca8ac1e0d5959092c2f1ca6d283e8f45eac9f737362fbff9b7c3b14f961",
            "0x89dd59244bb4f02877aa8b3deca14baa4a369b08", "141efc9fc56cb57972c77c830aace4c4d0bf9d0ba8140eb9bc301494cd0aa63e",
            "0x67bc8fb4996fc055d7a009d974ecacdd0ae9b049", "60b8ea739d823fbdc830a0a0543e304dfa9762131a79f8cc1bd64f5a25b90046",
            "0x8f1e52357cedc1d4192e4057e55039b7c0eb7098", "d37c292d84c1c26dc789c9bc32056a9487fe116b06fdb5d1f35a7fdf18923b8e",
            "0xc054f4133af78386c940e33221d9bcce4e11adb1", "55689a10e1959c7d251babb26bed0011a517a9a2af41fd7999751e4619d425fb",
            "0x983b9643caa987315b5381814cfa4196138b4273", "b89114e67159fa52618193551afa0e2cbf10268c8cebb9291cca4b0ea9ff3167",
            "0x98644f83dfef9e7657d2de28bd899020dc456f9b", "8e202031ef7982d17bdcc86a8033a8451aee3bec4811e1944df8dbe176a50099",
            "0x30fdb4171b4b787f5f9449515cdb6f1a4a7e090b", "57fa432ad9e0376897a27d0dc11cc09e68775ba7e3cab290db9d3227fb23eb62",
            "0xe6db47a45121092c6feff4faf77cab2193180413", "c6900b6db43d276b64f7534a84e6da28153e309c3a618fdc58b7cc1d755a9efb",
            "0x5ad85f417364bdbd398ca762dd105f01d2907d6c", "e5abea9696a038044c7d86b440c2841afb6af3c811ab8d54581bf7872752bbfe",
            "0x14b4dc14242023305121fc969b366b60cb9c903f", "5ebe2d97a09f1522b350109a90679de6f34df712d8b2ab616a2c96d7f6361e26",
            "0x1bcbfff19b869d0df7135fd4ff8f9f99d82d5ba9", "f70ccacbe7d314761c9b8936bbd95b1a0e2a2aa01f0ac3da96f762a7a7adfa05",
            "0x62da1e7bd84b07122f748c852d1b913228d4f917", "4848b18d1473b3292a82078b2aadce81343d408b2564c725491f619571e0c5b6",
            "0xb8c1a7d68caee49356f23ca65a5fd44e1d7cf6dd", "04e8c548d795bca66ebf159f2a9168ef0f55fe6d47f362a88ac71bafe38e47f8",
            "0xf233e0939df8966ed5c1f08268788d3604816aa4", "658c99e2f8d7074462b7d987c91811f0bb5445e00116f9eecc2ac51105a22dd6",
            "0x06dd1c54ea0cf9efcb3ba78eaa8c56d169788108", "a397afb2749193d3cf7a09e6016dedfda033a7a7d775cb7d6b90addda466b0e1",
            "0x868934694ceff23f481caf5cc9ae80b0a307cb18", "31cdee4bf9ea2167af3ae8fe94ea18ca9bb278224d020df10a5217de4feeb303",
            "0xc0e6c1bd825749872bcf4e38e6a7339407b2fc9e", "1e64ecf453a8bd6818f9a8f9ec7e524937bc0bd05ff76021f76683707172cb12",
            "0x00f2ce49c3fa6d8af891f49fb7914464a3519be7", "722574106afc65532b1985021f7821d0c6c2bda05ce4ede077e121acd081955b",
            "0xd30fdec43cba9489fcd9a1a447bf5f68fecbd28a", "bdfa1b0cb7269daec56e3b8c158a74252e427c41c1c63f30d5f5b42b0abc8bc1",
            "0x78e9a1d67714e49a1bffeff8906a4f71832f2d5c", "d2b65f4564b8bbce2682dcf9c97baac1b5192b91c550097fd4d3e895c713d635",
            "0x34a9fa7828d6a180f25ee1c5bb62f984fafb644f", "e452266158783dc652a3b5d60bedf52ba3ba3a5bbcadd81e8b23905f339fad1f",
            "0x6ee284a99cb6a5d66e2f29a2bced6b54364a60a0", "fd3bf79a960abd465fe918edd24fd5bbf38ede1661384ff7d2dc7bb24af32a94",
            "0x716773fa942b2b7e24906762c4cf2724dea77cec", "8256f6dbaef5f7336866f7fd604dc4f9883b61e025ae3ff551710f065541c093",
            "0xb910d13f8f2500db1b41f02d84c677e794f5d09b", "23d6f32668ac7bba3da7e8279e29eecd9291e769ba01922d27241c1c11c1a293",
            "0xb0bff6a1775eb0418ecea1f4ff6d98cc37af8770", "b5ba77d981180d5f206443e1cdc924114fb94c3b675cbd6bb9848d2de028335d",
            "0x5bbee915cd83d9ac2496c2ddba7e6f8284adb2f5", "c8b3d0508b0e9b246a99e82ce0556f5618c7aff458c39d90361eba849699b8a7",
            "0x6e717c4ce2ebda5ec5e1c249bc1da19f4d8478d5", "eb3a79f0a3999fbcde806f92e3ddbd898408555353b26839a3d6b5346b6c8460",
            "0x4e76d323e421e037d0019999c63bedae92c8ff19", "93d6d1930167d0524fcb7076c93459f5fa16faeae4605519c3df4543384fdf21",
            "0xe91eff5791c7c230f4f570687b4967ec1c9b42d6", "ebdefb26f8aff657d23db4e5ae64a24b07f0c3970fc10e7006a083057097dd96",
            "0xd39b7d37bdc95d4771a2dee3780ffccc42e9fb25", "56c418d753d2e7f5ba6666cdf357516b5e17a1541c37bc13793e68aeb0b1cc88",
            "0xc48168b13e60561c150901e1dd0f6cf531780201", "0285b63e29eedff13bf89d003a27a89869adc6b75bd634c7af936e083bae74ef",
            "0xb45416ced8d807de00f9f479afaaafa70fa43a08", "789deeea9fdf64ce6cac545dc38e5f0acdf0131aa99b7bbd70e33640a1aa8d51",
            "0xc00c1a261cd6f91a121164fe32f61f98fe7c3a63", "9050f910ce07cdb58ac280b166aeca166899cb80437d4b06f134e7899ebf21b4",
            "0xc16a1e95c6113485251e1799a953dece4eacb70b", "88e4fac028622350a83b2298b783e3f10c1dd3ee9ce64294f1e3724748e2dcaf",
            "0xff61ef7403b0e73dd481fd81f057db4f2b3010a6", "3c86c788a961fe2e10e7ba4e8dfbfc340f48ace8e3806a8ef74d51af53f98901",
            "0x8672f944932227fdf65247219c043798763939c0", "e266bc898f5d349a3637d683f369c18e9492ec688ab41a2d25ad76782f6ca325",
            "0x22434b40cdba8e1e96aa0093e3ca0af0a9ab8cfe", "8bd939d1eeda3b6a6d3b90f82b77b7181b4136c5ed54b0caff17ec505404020b",
            "0xf00274cbfa2decb6e0e2c594af0bb3201ae36d88", "89a1f06cb56fd93b8717849f0fe45165d561431e0de1daa1515577b56175ec27",
            "0x6636e61f6fa97225813c1846a83e41422e681518", "3b5aefc91f948ab1044db1906deb8042748cb470b67ca7ec2bb36e39972592b6",
            "0xe41f24b7032191fa3f3a3cc8e26b0be5f4411057", "4e03f308c2db621c62849963f601ebfe04047ba74afae7524dfe32d99c59f99f",
            "0x4671d895774c62e9a38b1d58a0836d0449f126cf", "6bdc3e8768cc804abc19d5f58909bfc8aabe0f106d548775f50eb5dbb88a9ba5",
            "0xb0a49e5e1187c0d1de92c8f5dd4fb1226e3e53de", "4f2d97038a0b10b8833772173a319162cb7951028146ec8918f8733c647ff44d",
            "0x61bcbd4270f8cd15c4a44cadefa5e4468dd42536", "a58afdd61f6f1f6948da8d38273ce34a381b088c33af96628a7b01c1343c608a",
            "0x70007ba9fce1a8c2ec9a9e2e167b4c8dfa7a3c22", "2bdfabb353d0cbfe32d4c1e0f38efd4abec065f122efb98bca96a0e23fa1637d",
            "0x0689319085069173948dda86dceaeaf5fe140b6f", "3dec891257196a233613d35135165ba8b05bcfd19ddfecee41031c59a1493b00",
            "0x57269759825ff173f67c8cde55d380d7c9bba82c", "2e5c415998aca80e5df0457284a8688d3c5bb25cd6cb5376f254612c33b9544d",
            "0x2070bbe148d44528fd6d81fa338f20ae5814eecf", "2fdefca9a2ec13b3b437e171b447991d69502a0e4bafe23ff63baaca7360228c",
            "0xeec9ac14242d31756c80b8d1c029ac2b8fa84cbf", "f5e17429e11dbab30e051c7c263ad2462a9abd95051611729c963606c5a2d11c",
            "0xda17212397fa664b572f26b6013d02d94a524c94", "7d740d402eb729bd6b14a690f6d07b3d7d240ca56cf639a67d60747c37880a6c",
            "0x1f500a94b4178a79482c0bda18ff4763e220df58", "6c866dbd7cd6257a75d3960270c6b3690aac2102cc6b777d0719489087b545e9",
            "0x6d5db3669ca7db54e7f6c2f10e42350c623d1031", "7ecb23038b86e0978be36f8718d2cae5bf29dcc683a8fad4979e30d8490db13c",
            "0xecbbe7b1eb5d5437e4fe16c67f50f10602381286", "cf3587f2b2a2ec97d02970dab8bdcc6db9651d5c7e3fd05ebcaa02b713a7ab7a",
            "0xca576b7eccda77eb39619c133dc59c232d827327", "febb6086af86a462238dd7e9f06a1165ddb9f80c9c2a455be05ccfe92635fbdb",
            "0x0b219521b4fb6aa0ea7ae2b081af5a85043a55cd", "a0bbe22086ff9c12a2ad6f99f1d1d15f12f3a832567c471de0cce866e23907bc",
            "0x2504e3a1fd0f2bb614f5527a28ddaf2490701053", "35057ec97cc436e6ae28991364ffd1f5ab02bf41d72de71ed3bf902fe057516f",
            "0x77b64735ad62444c36bdbc6380b2a15100f6c676", "94f557cd9ed715a93e020c250c2ffbf902497bfe823cbe5e2043b413a62fcf8e",
            "0x9c16dcbfa3387360b04a8d64bd837e32c8b6e712", "44322a32872dd72583435cabdf09d9b4eed9662a02702262cc63337186240616",
            "0xf09038a7ce75ffeec272cffd9f7734161ab5a153", "51fc905ab24201c20ef9d657e6c715ef2d76f6ac203d373d78d180a2f7ec0af6",
            "0x6c92a7b9bb74d8e8121e76698faf5938d5dfca85", "5d907ba15e3c419e2ec75dfeda38f7263a3225b049ffabfb4aa38b3f4f55a053",
            "0x278856ff304214d0c7cf33aa3589430d56c78e98", "23bc7ab7c93f1e8899bfdc4c2a5748f205e6cfc60394b8a2ec5b1e437e1cf9e0",
            "0xdedea46b91c3e9a6174ab5b470280f39c1101fbf", "9e4edf1e4089373c37af05dc81696c044da2a9feb720ec7f23cf88aece912743",
            "0xc527ba93fe00907fad8a4e01de380e9aee278f48", "0b1672aad2f98b7dcb8c2ab058eae5e16b6e0d8c67ab0a7b05aee23b0314d251",
            "0xf50b62920825cc1a599628a30422fbed528dd758", "676d4efe2f89d7dd5bce733dab6afabb0b11a273af9c335a5f7b94a700221f7d",
            "0x673e41e015c72455df5ab798bd88f89a24e54119", "7fbd01087949d0f67496e74dc40ca7a0ce86d74c8750456827ff45dc52778423",
            "0x686534d17564b1d987f322935a3f0dd2b018f8a0", "8f415335d1e1a376ad5a3f8a6d53a5d88e929f729fa9d5085039505c59f8e25e",
            "0xc95cad2d590dd830631ecd90b4b3867150ee4975", "c88d0f5b718bafc0532a86c684a186f7105ffd1a014b20afff19e63846c9afcc",
            "0x8aa9c01b71035a7b8f6aa682176c4c0960b78bc4", "3f88f62e1103f8ac1d61e551e28ed1a8a5cb6b83a4444b53639846a373b7a9d0",
            "0x95928a6b92bcb877eaa4afb53a197343f9a9dc6a", "1e137ce2ae6a39fd72056ffb414aca5d6279d09214557082f159c899b0d19c8c",
            "0x46352a0986da6c7f6d65f4843d91a6c0ed2e6df0", "a697488723d4dc880f2baafa34bd759d6926451e99ca7e43daf157374739e541",
            "0xd1f13b2f64335ac269d93a75f11ef63ac7b2dcec", "4192258ef48be78de3840750bb5b2c26841c4c9689ad88efdaa5c013a322462c",
            "0x040032bad859b5fa1853c7895e05b704ec7fe205", "abec6f82b066908897aeeb2dbae3e83d15b733bcf41855f2bdb96ae3f2811bb8",
            "0x965952a08bc3762f0dbb21dd8c44b906b4ffc290", "61dd4fee3c84594db5dfedb0177c97bf4d7423a6de6df5f7e2f841d7b91cbb91",
            "0x431c75d2937725ce7a9c83627b6a10de3d152a2b", "f0965d0e8f251d0ad64efc64043eae8bc9382a6fae735baa088557f7f7be3d4a",
            "0x5d33b9e60c27df5ec96c4f4f150c4b97242ed413", "17e0edf01ecc7b79f0036b3351bea282ac138d354df3fb094377cb676b46beba",
            "0x6c6a15eed91f9545d4ba032f3833d62e66218823", "b16d91672d0d4d46e02ad8b17aae82d1d4c3c3baf278c318e593c1ad7e75f731",
            "0x46800494bf163c5a844940bcb58f2b4c4c174a53", "1782c9244c565fc16049d9ae6adb1e8c7698e90036233087c01c398c196b3e10",
            "0xf8d52ebeafa147a623748bf445dfe2170725dd33", "2df8c91d88ff16b038ea60118773d6b933ef21154b191d148e98a9f28b120bf2",
            "0x096eb24a26221256725846fc82623d19eb4143d4", "6752c55128eccfca4a6b0f2c07c082e8c39c8e6335b9e171cf0b79881c8d6593",
            "0x659e69526e15926ea31d9da3ea053d62bb0ddb00", "8d8df64a6cacf23b2d66ef1bc4536d47f4f7bd6518b54131d182837357490acd",
            "0x96cd0b2a15aa1a4f41752ec139593e4a46e47beb", "c114907d7539abc5a2941e2080b937b3ecb1f5b9988c752b15696d8b94fe1b3c",
            "0xeff5cf0a2760dd97da23770380fe72f9aaa33079", "ce5997ad6096a792d963077dfab0ad35936f52bd104da35684ea080d3ee5dd01",
            "0xbc45ed55f5aec8c1471140240e357cf3b1b17acd", "8e6894758d3180b708e2bcf98ae3fe9a3785f35d76cc0aca4079c2329f8af256",
            "0x2cf9abca83ed8f4b6e3d16078657e10978a73fa6", "d6db67773ed3a05ea1a0ebce84819d2cf3e26f73e929fa0cf220c82930ea8be1",
            "0xbe73810d36fe7ef1272f847fe757ba4d6b62c1b5", "f389f6eddf24bd9cee6922741e44a8f3548e56bb53c0be8dae17938f1933a8be",
            "0x154ded4413c175326ab6cad22b4af9ce1032cae2", "b7f35856909e94a8088e74acd587e244fffbd512c759c07896ab07b1bbfe09ee",
            "0x0f1ec0e08cc69c205cba693a079413fc058ebf0c", "9c0e0be86102de6670035a0bb013286db4ac52019d62b4a48993329e7a879241",
            "0xd31cd8f07cb620901f0ab35d32e8d7e53d38de02", "c1b472257397afdfc602915cd6604414dbfd2df9d22437aed9a353191ba21e45",
            "0x597cf55c30a2207ab41f54b8a6e484b4989c6fda", "4a430f4cf2201cb2ab2c8d8c0993e9ec31b51fc4ae0e4a2fe9e2b5e454421370",
            "0xe167dcb69922e8a6ec4d0b04d543be2dfa350864", "6c33198bcd9f2d5ee5147c6ead8a4af918d8920ae0523aab38b82270d7f9da7c",
            "0x7a3d849f4620b24509b87a1997d3bc8e24f5233d", "b07b3478bbf9714c4717cf339caf33e7b6108e6b9d9d43eedccdc4f33b27037e",
            "0x2ae6ca5142d9b47efe4ede6548918f788ccc28d5", "a7d8d481fb22b4e68323949df67dd0525e7d3504949f6c8ee59c9d429d770778",
            "0x42d20f462687df84559841fe4d5b75cd9f376ca0", "41990db1d80522228e77683baa9f440eeff9d472bacbda9c6b45e368beb70d04",
            "0xd1fcd5765bb30897546000874a2216cdd0478a7f", "498c1f315accc879fd348dedfb5d821afc201bf68f5099bd039c944a3a29369b",
            "0xdb3b2d4140f82180b7d5ccc727dded0452076baa", "cf9b75c98ce5a7575ddf1d8d28c522cde235a128d50d4357dca63922795b6cf2",
            "0xc6c4ffa3dd533633e012ba7e643bde17044224ac", "0487ac328a0c3bd92af813b84b27a07f8cb18eeee7550d56bb3aece39434a5f8",
            "0x382cff3d6278116b24d0f6ea92dce2fa73e9c755", "c5b6e3dd0256949662a5f9eda9619838a7853240cc4bc2149a748e76310f3829",
            "0x9f9ce095a0f3ef08adaddfd7874d7ac0f7965348", "d2e972b709458b74314a0ac00d5a8259c3cd46ce4e658e8f1f0de3aa1589d6fa",
            "0x9aa7cd886fff2c3b50a0386f74e15ab9c1562b32", "fe37705ee92246cb365c5da3010219e78207275a53332e98c5847b046c1de662",
            "0xa95e7c3b6fe55a2a603ea8e295e4247b9717ab18", "451a03271a6fe1ec7612ea79a3fa42de8b204b1aa91e8c72de226bc1bfbef8ee",
            "0xaf6b1119ba21b03ed3ac17b26e16b0381bbd02b2", "f29b4bd869982070c4f2e82f4a56e636207cb4024cdccc390d9a6f28096fb7bd",
            "0x3140540d0340ff153e0a9fba1b9a818b8a4684cb", "763d873176fbacc003469c330209ee02f5177cfdcbdfc18530b16cad0c548372",
            "0xc5d43f5a85e30b4d46f482d87f3be5b9746de618", "d74cb6ecdaa98002ae01f87b8f9c97efaa88b34cf67041391f355b529984b56e",
            "0x39c586dfe601c6609dd8c459a510049188fab950", "aab7517de1c7247890bb6100b779bf5e12dfca340995fe11f0988266f39ba872",
            "0xe08b1fad5f2d0365ec65014eff41e2a0ab9f5357", "197e43a7f9831a21c37966dab1d9513ec78f9cf49a9e98d7b05e565ea04f450d",
            "0x1ac9d7a18e8545d7649a81e9e4cf26e83a14a9ac", "ac6b00fd0bc92cbf2de2c1a97590bc12a9aa8a86db9730b724a318d2159ecec8",
            "0xeabacedcab5b0790d1a02606fc4c11692174d60b", "1db4b1bea6d75bb565255d656adac08a1e74767810ce68d27305d274ed8f0d7b",
            "0x35c3c78e98ed65af88455a1993340b4b343636b3", "2f6802c910f0b6010d32a599a71e0c4027aa48bdebdf9176d4219fd4790b20fc",
            "0xb63a299ec00065e6221e5bf93ef50ad55afce88b", "3c79e1b67a4032a6a71547baf80b88f6db8ad872bcdd67def5d503e4dca67f2c",
            "0x327be960d92bff7eddd8cb763758624cc61a63e0", "92ae0c9f67ca25cc6862958e738309123e809a721a8c10cd55a8ff64eef2cf23",
            "0x155c1ee3f77d59a998c4345952e1329b111b1177", "a4bffe08186608004c90afe5e161690d0e6693ef6249d323493f251a313202a5",
            "0xd1f4689a83e86c4480f429339e4de566f8dbf688", "1f993b81f22f606d4ce14b4c6c49dc8cff84e3498e7f1a568d4a0e46c883ee8e",
            "0xf18e930098f69c0483b048b2973db734b838be49", "718d6308f14666b02c403ae04e0573f04856d0de0ea26a9848723a3f936e395d",
            "0x6ede9d6de4f0e1a417ea431777ef66492f111729", "4be6d09e84e81b97ac060e522be5baf3ad477ba9828f917515fadf9b510ee630",
            "0xccd0c74f5fa738c5d5b2234aa1213d103c4f1480", "924e7e6bee03b4d247285b8291f36ac932a8fb7edceb500212ecd8d71f3c998c",
            "0x89b61183483684a528bdaa25074c998bd3e70c5c", "1b9b92e810aea3b7983c882bcf86e18683bf5f55ce0fcb900ed43ef1a53b1abb",
            "0xa425e17690d88c3e1fbd3ad55d3e271396ac9007", "20ce54f519242f61b4d35b3694d7eb6a9b209f7c14b47070477cb5a8db9dae7e",
            "0x4f60b45ada16749dab9a4f62d491d5faa4664b39", "294748f67c16940fc5bc0879780976099a123f1aa131425ff470e7bf30b96f59",
            "0x4474ed505387268ef418cf8072d410047c154381", "99a71dd1e031e99718d60f0dc23ebadf901d29b6443c86fa9e30dd3f980ec4a3",
            "0x028cf665a5cf1c413751b59f934b3fa3a5ec80ef", "878ea6387c32ffe50a06959c920d70b03e9c4d041cde247656d2150f958acda4",
            "0xaaa3faf57fa9c3f755584487cba90937945037c7", "b8e52673a365d97a61f26797c56e42ea86f8c57413c735467bd632096fc673f3",
            "0x68884dac1e959016a6d9f8d24fbeefd9b79a0de9", "bbded664b3221fbec50695cb3c1edbe64992810e4c35ef34025d7564524114cf",
            "0xc8610a288f55aa6d98d8e0d94ebe5d6497d45838", "5461c25591cec566b161c90c309994d9255dfe299678548ac2e739bad08d3c5c",
            "0x245c15cc6349f6b965355f4c03d6fc0c5db0280b", "b45cfb4dd07ef92f72b4b4663ec5ebff07bf3085d0c8d51676aea446eb27c2e6",
            "0x455c5a75b2a271e4c9292814ac9f4aaff0bba513", "438f5d6edab56ccf1b4bb2c3bcbcf3c76f83a6684391ef43bf598ea45c21c623",
            "0x4275f6daa67156179a9ac1cd5dbfbcb6837f664b", "ff64330963a712cc317e430f369d16e49a190f227ad52e27901c7d0f4549284a",
            "0x20c36f1392f3de2606213ad6addda9cb31b0f607", "167901671d15879f28c1a2cd011941b0f18d7932094b59882bfae768c65937b5",
            "0x07a691e194cae0a5a1493c8c20ac5581bc227e8a", "b571906b0d206f73d56b3edf32e227ab4d5a35f18103458da60a662649bd4711",
            "0xc9a40423a756e550ec0f2208d1bc4fb4750ef156", "80289b1783488c774e4de48e86397fd45050145f0f3e91cc51852707d2a30dc4",
            "0x493135a387ab50d5ff3f867202c9c5408067f969", "18a5dcace885b04f7d67a590fda8f8c1f22e600b89e24374c8a35f51de781ec4",
            "0xcb1340cba992c3f15cdfdfecdd1fe4b7e36884b7", "bfc7f6dcd79689d5b1abfde98ed12de12161a124a4e99bb60bc8cc78abcb6a5a",
            "0x2a242571380ed9d279eb3f422d0bca44662e8d6c", "acdab474a574a1592d8b88f8a4da0f2147b6cd9329db6580727642ddb0f0c91f",
            "0x225de515ee81d98be29a49386d53d3941dfb5871", "96afdc1bf4f9fc5a18464bcc56f4541c8253939c40c33f9940a4f3a7f76ec093",
            "0x51e55f05c9e4fa7c42f0951707f5895d3d83dc66", "eabc4ad215f7d314b67affa2bd054077fa7d0fa4dd0b003141e20cbf6b437bc7",
            "0xc6558c566e1710c6fc214d114b029d85a72458bc", "549fd5b27a7c0e38182f816340ae71d77093e85c9daa37599872288de261cd3f",
            "0x0921f5420b41d149bb7a5ad1ce9345527247ccf6", "a4d83e5dd71ca7b4eb090ba39d34d365acc352d2207d463d283fb48d1b97a88d",
            "0x9573ec134ff76c9c983eda285fc23d8231696976", "ecee64cea920d62ebc7c96dfaf7c44f9afe0302d047d45729cd7e12092c1e6d8",
            "0x8f16d687b62b5e368080a026591864fdf49aa2d1", "b37f1599f2e528d8e302f1105b278714dfd55f2a24104be39b94d4e0b38dc3b7",
            "0x0856f2ba1d13fe1849e07753485f73795a755ea0", "ec9cbbe69a477114fe7e42911b637df78dcbbbbf864541bbf5b9e8be37e0f076",
            "0x924838dd1fc87bbd5fd071223ca5599265a9a9e4", "8269a6b1e65f4cc47f0e04ccb294156bec6c565922199b9a9b442505feecaf18",
            "0xa45d8f4c6806c2fb3e92fb456193fcd81607b462", "547c82315a44523b502d88ec8c9988990f3ac3b1903d484450a9a7ae302d2dce",
            "0x29f48725521893b947b2142a96d1df73b83c0cc9", "67d7ba1991275dba498547d3391afd065e108796e1d5e8f085a473f54223263f",
            "0xae759ab7eacc348a7a4863ed6e21b1255b5ecc67", "6b569a06ca88d1f0730c6266cfd8541029b6953e6a5c388308f5540940f6fd92",
            "0x3b56255a9ea2892d606581cdf7184c6ab4e18525", "7dd1ae0318b84b5c84b67991aefce6395d7137446498e388dc0cc8362e2b4250",
            "0xdaa3fbc9cc25102ac33bc6b18b64c664dbc0795b", "28889fc9a23f1279bcb9a11f368a2355b5d983258a9be770f25186ab33a822b8",
            "0xe2814915b444eb2ae1a0f4bb73fb80108269d1f8", "9ba6e5d4c89957e4e3496242c44417c2a4f05fa324b75b1b59bf981cd30b2b58",
            "0xd10651c4fe2254fc1920a11f24041ca32f630e9d", "8be58d7c3b8e88e366d70539185303ec393e914314a943889c0bb422cb22e9b3",
            "0x8cb1c22b3d3d5e1cc1d3a546b875d2de05972a95", "5be525e9529ad0451fa27bd2b3c347a418654e5b81cad66241196ab7260b0f1f",
            "0xba589eebc0c298080f38e953f579537d6e5c4747", "88136917029dab62b5631b40d00ba3535736d1ac6a26f2ca9109eefd7c1e5ac7",
            "0x7ca28e413ae6da09f366088e9da9565e8564eb64", "268855dd1e40d8b3c01fcf6207d1ef60a6792a831c38410cf4fa408df5382390",
            "0x897f5b246664c1d14564fa2467174f5295dc0e32", "690e94f010e992f0009565257322ea5ad3d10cec5a5944d2243b1b5ffefa6dc7",
            "0x48fa34b459d585ac9e3530fc6bcd27eb21019c69", "a3802dcdd6f0d8895ebf31bdbde980fe2397266cc2164b4b0db14b7b470219ae",
            "0x07226ef36f84eeb7771f555ff2ca6bb10bc8df72", "97ffefb99374539620d76ca71cb4dd9299db633b9fc6008f8643459b1f6e3925",
            "0x1ae2b31cae3bb0df0c2bab1099e8428c6d0147be", "0ebbbe5cc8ade70d3addf8d2a24dbac204196df882382ea1fb583b51eb9262c7",
            "0x64933b342cfe47a698ea9dca29859ed27dcae861", "5e9d34a753b1f4b4a83f0da9fa3266859d42879039c9ef29cdc224b0efa453b3",
            "0x4fb58cef950ead3c32ed954c5209aada5b184dfb", "a9cbd6f4cb40be89482893f3aed44bc23424aa7750643e73f05a1156b161d298",
            "0x4ebd96328898ed31ef159c859c6e0e35c9bc288d", "5a31576f6f47f7fa2c8d57f5aa44d5fc9091a817c3e075472e1a932a481c1679",
            "0x55ce97b34c63d05a9b07c6326054800630896813", "4c4555f24c3b2434a71a615f8409bfeeeb3e1906d09053fc0e310497f5866f64",
            "0x88fa42a52e529c992265b2a5e0b2af6df11a9ac0", "cffde28ce2303172f3edee710d6eb60e8e68991c41b4977c0acc7cd03ab03e9a",
            "0xfc4fcdecc4daf296f7aeb6903ce694f41f8d28b2", "c02cdd0d3e98800b976d4610cd0d46e55a6aba20a5b2ecb4cd11becdfef7998d",
            "0xb900349b39fba015483611b9224334ca47cc2a27", "dd83c16631fc2f501f688d03dd5761e6b7e0e64504c15e6fec1670fce890e96e",
            "0xde170a4ec3b84679032ef1fb3f0793e2460cd9f8", "d646f94630c41e6836d0320e62f5b5bc804c003ad093a61ec0e15bbb1bd1c130",
            "0x2f9c993be8c37bcd85f39adb8e412941ce15e121", "f68f6ed47adb911a484dfdd5d1f5a662fe3519a70a6cd9fb7b1288d1f67e2415",
            "0xcae387ad8c248f09e56632bf8e71d055f4c5f22a", "3d4102d7589f90c956c2787d073e74d219e0fc20cb4ab8acaaaf6ca7b0ffceb4",
            "0x56219375073391952aabb67f6ece7c59d8c1d1d4", "aa79e4bbd38a0f9eaeba8d501bfbd4149bb2ad75fe41e10d9cacbbe9faef1dfd",
            "0x12c5728812b0d3c32aec46ed3201c2d534419ce1", "d80a44adc0c2851b125739c17a198de0cd8946fcc9e4173fac4892a15bf3d93e",
            "0x8ddf236d02870fc2fecdca33dafff13239591eaa", "d47505771397c2ab247d1b48cba070fcf7c002e3983d36632b4e7d1f404a229b",
            "0xdea4f368586eb54ba80c6e8a0da5b5a4bd8d40b6", "942b2863ed7224e211cbaaf3067a9ad23c29a2e392061698f9a315e97a3915e2",
            "0x0c43ea719357510d59d054d3c2de77fc7d36234c", "d4074715032c2b153df34a0dd1ccadc5f75c8e3edae7d3f9b3e52450e6d73388",
            "0x769091b52ba991820a9db91d65cdd1c35cbb4896", "caae7c7dc557fc3bf524776be36e0e797414b8b1c5617a25ce4272c6970daed9",
            "0x59c41e73419ad26dc6e12b6598617f8dc1c70b34", "21b84b581a69c3fdceca0a7eb0f2193037ad6d502ab24bdbbc309b602161a63b",
            "0x0d0576bc65d01e6a5c94363ca776f5716604d440", "6a897d32068f35541b7b6aa83b901997772fce02b7f875aa29fa23999602af5f",
            "0xb2c9ee15f93f9586c714b7e9de42d59be1184acb", "b821cda7674b3219ede601492a0b7a2eb7e51b4a01835861ebe61ebb28d35ad2",
            "0x919e51d68ab0572070014797912593fa40292961", "267466597087a9ab7cccf5ead8b25719090a6fafc847a5b17222772282e6a3c5",
            "0xa1444749a2ff5fcc096cf25917fcd6237eddb924", "45042be199e036462c9b432362db1c38700fbe4af537cd80088564a678c57959",
            "0xa5d689049355e61f5af583d64cf5827ddeff6977", "7216d4711ea7c998b565dae744cafd90b3be22efdb943bafed47bd15df0214bf",
            "0xc505e859a14ed128620178f0f8bc2458d0986bf5", "7cdc4c719eaeca4ed1f5579b79d86ec4389baacab71e192ba5d3466121a115ff",
            "0x456ac542ed25f29f6cfa931a0b38a7c3a9238301", "ba3b366e21df887e0752a2ad64e8b366c8c6845f5444610e52b897955c5847c9",
            "0x0c2f381e61820e731115d11f47ccc8df0d47cf2a", "d4508cb74e2202d41c1750789af89a810992eafb5c10a08771c6ed124a4b249a",
            "0xc98fe995324e718d9251808e0b06b764fdeea490", "ff431de6581053e9d8a72cd3485581025d8f7f83066d86a4981d75f4071daf0a",
            "0x39312f3ead4bb10341d695576bd9c82aba357acc", "ff983f89856a9eb175b9011a0f0be8327353e7102974d74837fba98deda205af",
            "0x905e3203dbb10f8a68b829c4d90b7f07dd5d7fcd", "b18a9a667c2d5aff28874dbb96d181887271291ca93edaf470a4c1c903605733",
            "0xe881af229823682b8e564c3188ee16b6574b29f2", "b4ad8997a0f6303760e7b8b179c1d76648dbfe8889fd73f572aa5351f351030a",
            "0x95103f184273759e2277356c271df53ed2c1a81b", "7c5c0607b80366e2fe92011c24e2f45afa35f295b271db18467541a48697bd7d",
            "0x9f9f91cea805dd3a036815c162fad43eb728e68b", "831680c931a7926ad5206abeaaf4dd1beb01f7b34708178259817320c226845a",
            "0xb887acd12473e3d7e4793f51329a8288bcfc5831", "dce9f5bd18aa712be19052a93a151a3ffccac99fa38e17c89c7562c211795ac0",
            "0xd1529e27844099a84b4836d092c2a8f235de83b1", "4b9ed35c43aa19c1095ad74ad09e383053271d0e29ca8d28f5d1e9be1d85d74e",
            "0x99ab96c913f2c2e0f6f11214418f2b9895a79972", "a4cbed47d112598f660219153aec2591af1732507a8b6793062783b2735b0e20",
            "0x5a2207e10952e20b3e880ded87e5b5880e5cab62", "d2a29bcc39c907735a0292e04546dc3f126b1d881f3799020ff5a483d2d4e578",
            "0x1bcaea1c7fbe3d259b885adcc93a59d3b35868f1", "83b79468953ca75cda49c9657f7f01e57ae2b40fd3824528eeb2749aa0654c71",
            "0xb1ec332b4cb62bb8e0cb59da34bccbbc0e13b194", "0e0e9efb7cd51032912fe30bae73648d7d2bfa20924286d7d5e26bb78de84511",
            "0x02d99953a1beaf90432812aa8352c131f145657d", "0935b6e28f4eca460a491b25e01abcbc2aabf173715069c4e883886c576b9915",
            "0x167412016b2a01ff107d843dab3a946afdce71db", "ec1c60e9c4c5b593d31174690077eaaeb72e9c2150f39e9f94a67745853fbd66",
            "0xd87b16e43df7de451e1406681db4dbc6a78509ac", "4de89520f8ce3b80dada6b297c13157f658577f14c9aac6093afd297f0305171",
            "0xf507444f48a9cb049b118cb3bc1650e69940cc9f", "77dace92280d1608f2ce1b34686fc27bab470e91b2c08ea7f558511ca938fc54",
            "0xd9cf7c365f0640bc20693efca279785595de832a", "f8acfdc5489906b4af13ae4ef533f3bbd3fe375688691d80c28d0d229d0ceb76",
            "0x766173c37688d0794a47f71b89094ee44a64f123", "ca30e6705cfa5fe1c3104baaefa31c431279986785ce33f7adb8bdf01357197a",
            "0xe7e503231b0f04e47768895746e9243f71571e55", "858c9f220611c9afeabaf7f91b4a3e84e1c339103f0b034f8735e35ceff58b4b",
            "0x6bbc9b8d5db2bcc66e51921f4190a332dd2d1298", "0181354fbdfb672ef691749307035f80d2d13fd397925c4c671754e176a2746c",
            "0x0eb08804e1bff43d5d386bd6ba2842c9d6208e25", "be14d786d5048781dc6aadbfbd8c28c72a7cf921b17760b9df4149877adb171c",
            "0xfb6b127709dc1b62045fbf0298d6cc24a6a55078", "747067d2fea6f0a0882f25902435778b8721a523b6ed3f1008670352e3e66f8e",
            "0xed73a4069e8c660c0f087a50571b88f643e5ba37", "16f9bd69aea0a7b98b2cef3995bce7fbf5ddeaa34a05e6809a056dbb68433e7f",
            "0x615e11e3877acc3a51d79be054a6477ee5db8f8c", "7070e09c9d3e83d72d875011e8b0a8de440249c80332cd717049aa406d195d5c",
            "0xfeb9e6802f0cf5269054dcd84b6a1bb6c6530b00", "a1f67f8583a8547f3fd4a3d017a3e6704e114c78eff25306c3cc8437f0bb84f7",
            "0x8adfdb76dd4343a9e9f1fafd3c6dfb7aaaee4bda", "5309904a05920b3bb96b6119d3692acda999b451fe70e20e735ab8a9c8db62ba",
            "0x62393ec69767c10b796d849ef1b17d8c0f43d26e", "a41c9bfe4e17f4970e69a312ad934423ff19e29a4d00096e4d372864cfdc1944",
            "0x598c0411a9f27a98f891997b05f7e37257eea7d4", "0b30b2ea7e12cb2c1196af385f1a2e59ac863edb5733407aef96d7c297141f32",
            "0x43f9f07bf32992fe416b5b0856d0530bf2dfd71c", "ad0e5f8e0ed2ccfe57caf2296d037210aeb03c0943448f7a0a03a03b7684ef78",
            "0x1069eaae68c245e4a07cd5de2dd93c6d57f6493d", "4d71aa5036fdf2afe0ca057f1f0079db176f23b4db1316345efb5d95a437536e",
            "0x891118b8bdaf5f15cc8ab0a304860ad3c1e362e4", "380724838f56c4324f40536355b2b0fb3e8454653ee53b5b743dc627e890875f",
            "0x84f41b52e8f1b54f40d5358f7678c4b42002934e", "08a684619d07c5ab86d2762cb1e721f4d838b3fbaf70b5a3c90d76fc0c1f927c",
            "0xfbf972353486ab01dd46281d56292654fc4e7233", "79ab978f5cb3b55b71562375afbd89c4149bb005889a213b153fe11dafcc9a20",
            "0xcb7973765c656f80dfb1992b68f23ce33271e3b4", "e2857e9f1e5e250cc5cc975f6df4cfcbd24118751614a2314dd6eed4aa452e0f",
            "0xecc2422d1efc495c14d20c7d8b9e51d9f484e1de", "ba9d38235ac55a6907a9871c5389e6563bc3e27eb46193ebbbfdb244f471c09f",
            "0x7598e4ae0bf560ef7f5a4eca1aa2339886b7ae8d", "6ecc69e158b45aeab4955ca55409b6c81364f10fb25ec6e1973f39b7d181c7f1",
            "0x987b27981bcd301116640e7237532963453af222", "4289ae737522d68fd3b76c517f28f44ac631f742cba7ede7847012a0f548414f",
            "0x3ae4ae97585aa29670b776fbb468d73a90b20b90", "b8125cd221cc0a4bcc94cbd30e29749dc9801dcb0e6c3865b3bf58430010b764",
            "0xad434577834c37f6359eb6ea01db5d617c37c638", "69d00bb039f642e1b6a00f0957b1106a63b83a41ab20764f4ee48d5e644cc81e",
            "0xc18a77f3d1e4ff184ff9cfc0eddd2e943a8aaad2", "b696b8237f87245140a39d14baec52f74ee9bba2697d8295d991ecd95c131d6c",
            "0x56910f9b5b8aae36eab16b8eed54270f35ca4038", "df89bb51ee8fdd909c70fa1cdf2dde10e920351dab04fbb9e2d0d711aeb080a7"

        ]

        
        var addr = [];
        var blnc = [];
        for (let i = 0; i < nrAddr * 2; i += 2) {

            addr.push(addrs[i]);
            blnc.push(Math.floor((Math.random() * 1000) + 1));

        }
        return [addr, blnc];
    },


};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
