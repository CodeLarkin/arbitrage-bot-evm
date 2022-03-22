import { ethers, Wallet, Contract, ContractInterface } from "ethers";
import { BigNumber } from '@ethersproject/bignumber';
import abiDecoder from 'abi-decoder';

import { logging } from './logging';
import ERC20 from "./../abi/ERC20.json";
import UniswapV2Router02 from "./../abi/UniswapV2Router02.json";
import UniswapV2Factory from "./../abi/UniswapV2Factory.json";
import UniswapV2Pair from "./../abi/UniswapV2Pair.json";


// FIXME add testnet option?
////const RPC = "https://rpc.testnet.fantom.network/";
//const RPC = "https://rpc.ankr.com/fantom";
//const PROVIDER = new ethers.providers.JsonRpcProvider(RPC);
//const RPC = "https://rpc.ftm.tools/";
const RPC = "wss://speedy-nodes-nyc.moralis.io/4fa94a12b834aecf2526bd68/fantom/mainnet/ws";
const PROVIDER = new ethers.providers.WebSocketProvider(RPC);

if (!process.env.PRIVK) {
    throw Error("No wallet found in env");
}
const WALLET = new ethers.Wallet(process.env.PRIVK, PROVIDER);

// Addresses
const SUSHI_ROUTER_ADDRESS  = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";
const SPOOKY_ROUTER_ADDRESS = "0xF491e7B69E4244ad4002BC14e878a34207E38c29";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const WFTM_ADDRESS  = "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83";
const USDC_ADDRESS  = "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75";
const ECHO_ADDRESS  = "0x54477A1D1bb8C1139eEF754Fd2eFd4DDeE7933dd";
const EYE_ADDRESS   = "0x496e1693A7B162c4f0Cd6a1792679cC48EcbCC8d";
const MUNNY_ADDRESS = "0x195FE0c899434fB47Cd6c1A09ba9DA56A1Cca12C";

class ContractInfo {
    name: string;
    address: string;
    abi: ContractInterface;
    contract: Contract;

    constructor(_name: string, _address: string, _abi: ContractInterface) {
        this.name = _name;
        this.address = _address;
        this.abi = _abi;
    }
}

class Pair {
    unipair: Contract;
    address: string;

    from: ContractInfo;
    to: ContractInfo;
    token0: string;
    token1: string;

    decimals0: number;
    decimals1: number;
    reserves0: BigNumber;
    reserves1: BigNumber;

    constructor(_unipair: Contract, _from: ContractInfo, _to: ContractInfo) {
        this.unipair = _unipair;
        this.address = _unipair.address;
        this.from = _from;
        this.to = _to;
    }


    async init() {
        this.token0    = await this.unipair.token0();
        this.token1    = await this.unipair.token1();

        const fromDecimals = await this.from.contract.decimals();
        const toDecimals   = await this.to.contract.decimals();

        this.decimals0 = fromDecimals;
        this.decimals1 = toDecimals;

        //console.log(`TO: ${this.to.address}, FROM: ${this.from.address}`);
        //console.log(`Pair - tok0: ${this.token0}, tok1: ${this.token1}`);
        if (this.to.address == this.token0) {
            //console.log("HERETO");
            this.decimals0 = toDecimals;
            this.decimals1 = fromDecimals;
        //} else if (this.from.address == this.token0) {
        //    console.log("HEREFROM");
        }

        [this.reserves0, this.reserves1] = await this.unipair.getReserves();
    }

    getNormReserves() : number[] {
        return [
            Number(ethers.utils.formatUnits(this.reserves0, this.decimals0)),
            Number(ethers.utils.formatUnits(this.reserves1, this.decimals1))
        ];
    }

    getNormReservesForTok(_tok: string) {
        if (_tok == this.token0) {
            return Number(ethers.utils.formatUnits(this.reserves0, this.decimals0));
        } else if (_tok == this.token1) {
            return Number(ethers.utils.formatUnits(this.reserves1, this.decimals1));
        }
        throw Error(`Can't get reserves for token ${_tok} - not in pair`);
    }


    //getPrice() : number {
    //    const reserves = this.getNormReserves();
    //    return reserves[0] / reserves[1];
    //}

    //getPrice(_from: string) : number {
    getPrice() : number {
        const reserves = this.getNormReserves();
        if (this.from.address == this.token0) {
            return reserves[1] / reserves[0];
        } else {
            return reserves[0] / reserves[1];
        }
    }
}

const ROUTERS = {
    "SUSHISWAP"  : new ContractInfo("SUSHISWAP" , "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", UniswapV2Router02 ),
    "SPOOKYSWAP" : new ContractInfo("SPOOKYSWAP", "0xF491e7B69E4244ad4002BC14e878a34207E38c29", UniswapV2Router02 ),
    "SPIRITSWAP" : new ContractInfo("SPIRITSWAP", "0x16327E3FbDaCA3bcF7E38F5Af2599D2DDc33aE52", UniswapV2Router02 ),
    "SOULSWAP"   : new ContractInfo("SOULSWAP"  , "0x6b3d631B87FE27aF29efeC61d2ab8CE4d621cCBF", UniswapV2Router02 ),
    "WAKASWAP"   : new ContractInfo("WAKASWAP"  , "0x7B17021FcB7Bc888641dC3bEdfEd3734fCaf2c87", UniswapV2Router02 ),
    "HYPERSWAP"  : new ContractInfo("HYPERSWAP" , "0x53c153a0df7E050BbEFbb70eE9632061f12795fB", UniswapV2Router02 ),
    //"YOSHI"      : new ContractInfo("YOSHI"     , "", UniswapV2Router02 ),
};
const FACTORIES = {
    "SUSHISWAP"  : new ContractInfo("SUSHISWAP" , "0xc35dadb65012ec5796536bd9864ed8773abc74c4", UniswapV2Factory ),
    "SPOOKYSWAP" : new ContractInfo("SPOOKYSWAP", "0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3", UniswapV2Factory ),
    "SPIRITSWAP" : new ContractInfo("SPIRITSWAP", "0xEF45d134b73241eDa7703fa787148D9C9F4950b0", UniswapV2Factory ),
    "SOULSWAP"   : new ContractInfo("SOULSWAP"  , "0x1120e150dA9def6Fe930f4fEDeD18ef57c0CA7eF", UniswapV2Factory ),
    "WAKASWAP"   : new ContractInfo("WAKASWAP"  , "0xB2435253C71FcA27bE41206EB2793E44e1Df6b6D", UniswapV2Factory ),
    "HYPERSWAP"  : new ContractInfo("HYPERSWAP" , "0x991152411A7B5A14A8CF0cDDE8439435328070dF", UniswapV2Factory ),
    //"YOSHI"      : new ContractInfo("YOSHI"     , "", UniswapV2Router02 ),
};
const ERC20S = {
    "WFTM"  : new ContractInfo("WFTM"      , "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83", ERC20 ),
    "USDC"  : new ContractInfo("USDC"      , "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75", ERC20 ),
    "DMD"   : new ContractInfo("DMD"       , "0x90E892FED501ae00596448aECF998C88816e5C0F", ERC20 ),
    "SPIRIT": new ContractInfo("SPIRIT"    , "0x5cc61a78f164885776aa610fb0fe1257df78e59b", ERC20 ),
    "MIM"   : new ContractInfo("MIM"       , "0x82f0b8b456c1a451378467398982d4834b6829c1", ERC20 ),
    "DAI"   : new ContractInfo("DAI"       , "0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e", ERC20 ),
    "SPELL" : new ContractInfo("SPELL"     , "0x468003B688943977e6130F4F68F23aad939a1040", ERC20 ),
    //"ECHO"  : new ContractInfo("ECHO"      , "0x54477A1D1bb8C1139eEF754Fd2eFd4DDeE7933dd", ERC20 ),
    //"EYE"   : new ContractInfo("EYE"       , "0x496e1693A7B162c4f0Cd6a1792679cC48EcbCC8d", ERC20 ),
    //"MUNNY" : new ContractInfo("MUNNY"     , "0x195FE0c899434fB47Cd6c1A09ba9DA56A1Cca12C", ERC20 ),
};

const DEXS = Object.keys(ROUTERS);
const NUM_DEXS = DEXS.length;

export function initContracts(_contractInfos: Record<string, ContractInfo>) {
    Object.values(_contractInfos).map((_info) => {
        logging.info(`Loading contract ${_info.name} from address: ${_info.address}`);
        //let abi = _info.abi;
        //if (abi.abi) {
        //    abi = abi.abi;
        //}
        _info.contract = new ethers.Contract(_info.address, _info.abi, WALLET);
    });
}

initContracts(ROUTERS);
initContracts(FACTORIES);
initContracts(ERC20S);

abiDecoder.addABI(UniswapV2Router02);


const loadPairs = async (_factory: Contract, _tok0: string, _tok1: string) => {
    return new ethers.Contract(
        await _factory.getPair(_tok0, _tok1),
        UniswapV2Pair, WALLET,
    );
};


async function getTradingPair(_dex: string, _from: ContractInfo, _to: ContractInfo) {
    try {
        return await getTradingPairAux(_dex, _from, _to);
    } catch (e) {
        logging.ultra(e);
        logging.ultra("Pair does not exist");
    }
}

async function getTradingPairAux(_dex: string, _from: ContractInfo, _to: ContractInfo) {
    const factory = FACTORIES[_dex];
    const fromDecimals = await _from.contract.decimals();
    const toDecimals   = await _to.contract.decimals();

    //const oneWhole = ethers.utils.parseUnits("1", fromDecimals);

    const path = [_from.address, _to.address];

    //logging.ultra(`${_router.name}.getAmountsOut(${oneWhole}, [${_from.address}, ${_to.address}])`);
    //try {
        const unipair = await loadPairs(factory.contract, _from.address, _to.address);
        //logging.info(`Getting reserves for pair ${unipair.address}`);

        if (unipair.address == ZERO_ADDRESS) {
            throw Error("Pair does not exist");
        }

        //const reserves = await unipair.getReserves();


        //let decimals0 = fromDecimals;
        //let decimals1 = toDecimals;

        //console.log(`TO: ${_to.address}, FROM: ${_from.address}`);
        //console.log(`Pair - tok0: ${token0}, tok1: ${token1}`);
        //if (_to.address == token0) {
        //    console.log("HERETO");
        //    decimals0 = toDecimals;
        //    decimals1 = fromDecimals;
        //} else if (_from.address == token0) {
        //    console.log("HEREFROM");
        //}

        //const reserves0 = Number(ethers.utils.formatUnits(reserves[0], decimals0));
        //const reserves1 = Number(ethers.utils.formatUnits(reserves[1], decimals1));


        const pair = new Pair(unipair, _from, _to);
        await pair.init();
        logging.info(`On ${_dex}, 1 ${_from.name} = ${pair.getPrice()} ${_to.name}`);

        return pair;

    //    const exchangeRate = (await _router.contract.getAmountsOut(oneWhole, path))[1];
    //    const exchangeRateFormatted = ethers.utils.formatUnits(exchangeRate, toDecimals);

    //    logging.info(`On ${_router.name}, 1 ${_from.name} = ${exchangeRateFormatted} ${_to.name}`);
    //} catch {
    //    logging.ultra(`On ${_router.name}, 1 ${_from.name} => ${_to.name}: PAIR NOT FOUND`);
    //}
}

async function getPathRate(_router: ContractInfo, _from: ContractInfo, _to: ContractInfo, _path: string[]) {
    const fromDecimals = await _from.contract.decimals();
    const toDecimals   = await _to.contract.decimals();

    const oneWhole = ethers.utils.parseUnits("1", fromDecimals);

    logging.ultra(`${_router.name}.getAmountsOut(${oneWhole}, [${_path}])`);
    try {
        const exchangeRate = (await _router.contract.getAmountsOut(oneWhole, _path))[1];
        const exchangeRateFormatted = ethers.utils.formatUnits(exchangeRate, toDecimals);

        logging.info(`On ${_router.name}, 1 ${_from.name} = ${exchangeRateFormatted} ${_to.name}`);
    } catch {
        logging.ultra(`On ${_router.name}, 1 ${_from.name} => ${_to.name}: PAIR NOT FOUND`);
    }
}

export async function detect() {
    logging.info("Detecting...");

    //await Object.keys(ROUTERS).forEach(_dex => {
    //    getTradingPair(_dex, ERC20S['WFTM'], ERC20S['USDC']);
    //});
    //await Object.keys(ROUTERS).forEach(_dex => {
    //    getTradingPair(_dex, ERC20S['WFTM'], ERC20S['DAI']);
    //});
    //await Object.keys(ROUTERS).forEach(_dex => {
    //    getTradingPair(_dex, ERC20S['WFTM'], ERC20S['MIM']);
    //});

    //await Object.keys(ROUTERS).forEach(_dex => {
    //    getTradingPair(_dex, ERC20S['DMD'], ERC20S['USDC']);
    //});
    //await Object.keys(ROUTERS).forEach(_dex => {
    //    getTradingPair(_dex, ERC20S['DMD'], ERC20S['WFTM']);
    //});
    //await Object.keys(ROUTERS).forEach(_dex => {
    //    getTradingPair(_dex, ERC20S['SPIRIT'], ERC20S['USDC']);
    //});
    //await Object.keys(ROUTERS).forEach(_dex => {
    //    getTradingPair(_dex, ERC20S['SPIRIT'], ERC20S['WFTM']);
    //});
    //await Object.keys(ROUTERS).forEach(_dex => {
    //    getTradingPair(_dex, ERC20S['SPELL'], ERC20S['WFTM']);
    //});
    logging.info("Done getting basic exchange rates, now peeking pending transactions...");

    // TODO check pending transactions and once they complete check for resulting arbitrage opportunities
    // TODO check pending transactions for profitable arbitrage txs to frontrun (need MEV for this?)
    //      using: PROVIDER.on("pending", (txHash) => {
    //                 PROVIDER.once(txHash, (transaction) => {
    //PROVIDER.on("pending", (txHash) => {
    //    PROVIDER.getTransaction(txHash).then(async tx => {
    PROVIDER.on("block", async (blockNumber) => {
        logging.info("COUNTME");
        try {
            //logging.info(`Pending: ${txHash}`);
            const block = await PROVIDER.getBlockWithTransactions(blockNumber);
            const transactions = block.transactions;

            await transactions.forEach(async tx => {
                if (tx && tx.to &&
                      (tx.to == ROUTERS['SUSHISWAP' ].address
                    || tx.to == ROUTERS['SPOOKYSWAP'].address
                    || tx.to == ROUTERS['SOULSWAP'  ].address
                    || tx.to == ROUTERS['WAKASWAP'  ].address
                    || tx.to == ROUTERS['HYPERSWAP' ].address)) {
                    //|| tx.to == ROUTERS['YOSHI'     ].address)) {
                    logging.debug(`Tx (${tx.hash}) uses router ${tx.to}`);
                    //ethers.utils.defaultAbiCoder.decode(
                    //    UniswapV2Router02,
                    //    ethers.utils.hexDataSlice(tx.data, 4)
                    //);
                    //debugger;
                    //console.log(tx);
                    const decodedData = abiDecoder.decodeMethod(tx.data);
                    logging.ultra(decodedData);
                    if (decodedData.name == 'swapExactETHForTokens' || decodedData.name == 'swapExactTokensForTokens') {
                        logging.ultra(decodedData);
                        let path = decodedData.params[2].value;
                        if (decodedData.name == 'swapExactETHForTokens') {
                            path = decodedData.params[1].value;
                        }

                        let from = path[0];
                        let to   = path[path.length-1];

                        logging.debug(`Decoded method: ${decodedData.name} - From0: ${from} - To0: ${to}`);
                        logging.debug(`Path: ${path}`);

                        const fromContract = new ethers.Contract(from, ERC20, WALLET);
                        const toContract   = new ethers.Contract(to,   ERC20, WALLET);

                        //try {
                            const fromName = await fromContract.symbol();
                            //console.log(`HERERERE: ${await toContract.symbol()}`);
                            const toName   = await toContract.symbol();

                            logging.debug(`From: ${fromName}:${from}`);
                            logging.debug(`To:   ${toName}:${to}`);
                            logging.debug(`Path: ${path}`);

                            ERC20S[fromName] = new ContractInfo(fromName, from, ERC20);
                            ERC20S[fromName].contract = fromContract;
                            ERC20S[toName]   = new ContractInfo(toName, to, ERC20);
                            ERC20S[toName].contract   = toContract;

                            //await Object.values(ROUTERS).forEach(_router => {
                            //    getPathRate(_router, ERC20S[fromName], ERC20S[toName], path);
                            //});

                            const toToks = ['WFTM'];
                            if (path.length == 2) {
                                console.log(`Also checking token paired against ${toName}`);
                                toToks.push(toName);
                            }

                            toToks.forEach(async toTok => {
                                const pairs: Pair[] = []; // one per DEX
                                for (let i = 0; i < NUM_DEXS; i++) {
                                    try {
                                        pairs.push(await getTradingPair(DEXS[i], ERC20S[fromName], ERC20S[toTok]));
                                    } catch (e) {
                                        logging.info(`Pair not found on ${DEXS[i]}`);
                                    }
                                }
                                //const pairs = Object.keys(ROUTERS).map(_dex => {
                                //    getTradingPair(_dex, ERC20S[fromName], ERC20S['WFTM']);
                                //});
                                logging.info(`Searching for arbitrage opportunities for pair [${fromName}, ${toTok}]`);
                                for(let i = 0; i < NUM_DEXS; i++) {
                                    if (!pairs[i]) continue;
                                    const priceI = pairs[i].getPrice();
                                    for(let j = 0; j < NUM_DEXS; j++) {
                                        if (i != j) { // check router pair i,j
                                            if (!pairs[j]) continue;
                                            //pairs[i].getPrice() / pairs[j].getPrice();
                                            const priceJ = pairs[j].getPrice();

                                            // FIXME rename
                                            const shouldStartEth = priceI < priceJ;
                                            const spread = Math.abs((priceJ / priceI - 1) * 100) - 0.6;
                                            if (spread > 1) {
                                                const reservesI = pairs[i].getNormReserves();
                                                const reservesJ = pairs[j].getNormReserves();
                                                // only proceed if reserves for one is > 100, and both are > 1
                                                //if (((reservesI[0] > 100 || reservesI[1] > 100) && (reservesI[0] > 1 && reservesI[1] > 1)) &&
                                                //    ((reservesJ[0] > 100 || reservesJ[1] > 100) && (reservesJ[0] > 1 && reservesJ[1] > 1))) {
                                                if ((reservesI[0] > 100 && reservesI[1] > 100) &&
                                                    (reservesJ[0] > 100 && reservesJ[1] > 100)) {
                                                    logging.info("====================================================================");
                                                    logging.info(`Arbitrage opportunity found between DEXs: [${DEXS[i]}, ${DEXS[j]}]`);
                                                    logging.info(`Price on ${DEXS[i]} I: ${priceI}, Price on ${DEXS[j]}: ${priceJ}`);
                                                    logging.info(`SPREAD: ${spread}`);
                                                    logging.info(`Reserves on ${DEXS[i]}: ${reservesI[0]}, ${reservesI[1]}`);
                                                    logging.info(`Reserves on ${DEXS[j]}: ${reservesJ[0]}, ${reservesJ[1]}`);
                                                    logging.info("====================================================================");
                                                }
                                            }

                                            //const shouldTrade = spread > (
                                            //  (shouldStartEth ? ETH_TRADE : DAI_TRADE)
                                            //   / Number(
                                            //     ethers.utils.formatEther(uniswapReserves[shouldStartEth ? 1 : 0]),
                                            //   ));
                                        }
                                    }
                                }
                            });
                            // TODO check all other pairs with tokens in this path
                        //} catch (e) {
                        //    console.log(`Skipping path: ${path} ...`);
                        //    //console.log(e);
                        //}
                    }
                }
        });
        } catch (e) {
            logging.info("error, skipping .....................");
        }
    });
    //logging.info("Done.");
}

