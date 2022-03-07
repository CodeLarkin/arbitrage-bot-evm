import { ethers, Contract, ContractInterface } from "ethers";
import { BigNumber } from '@ethersproject/bignumber';
import abiDecoder from 'abi-decoder';

import { logging } from './logging';
import ERC20 from "./../abi/ERC20.json";
import UniswapV2Router02 from "./../abi/UniswapV2Router02.json";

// FIXME add testnet option?
////const RPC = "https://rpc.testnet.fantom.network/";
//const RPC = "https://rpc.ankr.com/fantom";
//const PROVIDER = new ethers.providers.JsonRpcProvider(RPC);
//const RPC = "https://rpc.ftm.tools/";
const RPC = "wss://speedy-nodes-nyc.moralis.io/4fa94a12b834aecf2526bd68/fantom/mainnet/ws";
const PROVIDER = new ethers.providers.WebSocketProvider(RPC);

// Addresses
const SUSHI_ROUTER_ADDRESS  = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";
const SPOOKY_ROUTER_ADDRESS = "0xF491e7B69E4244ad4002BC14e878a34207E38c29";

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

const ROUTERS = {
    "SUSHISWAP"  : new ContractInfo("SUSHISWAP" , "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", UniswapV2Router02 ),
    "SPOOKYSWAP" : new ContractInfo("SPOOKYSWAP", "0xF491e7B69E4244ad4002BC14e878a34207E38c29", UniswapV2Router02 ),
    "SPIRITSWAP" : new ContractInfo("SPIRITSWAP", "0x16327E3FbDaCA3bcF7E38F5Af2599D2DDc33aE52", UniswapV2Router02 ),
    "SOULSWAP"   : new ContractInfo("SOULSWAP"  , "0x6b3d631B87FE27aF29efeC61d2ab8CE4d621cCBF", UniswapV2Router02 ),
    "WAKASWAP"   : new ContractInfo("WAKASWAP"  , "0x7B17021FcB7Bc888641dC3bEdfEd3734fCaf2c87", UniswapV2Router02 ),
    "HYPERSWAP"  : new ContractInfo("HYPERSWAP" , "0x53c153a0df7E050BbEFbb70eE9632061f12795fB", UniswapV2Router02 ),
    "YOSHI"      : new ContractInfo("YOSHI"     , "0x16327E3FbDaCA3bcF7E38F5Af2599D2DDc33aE52", UniswapV2Router02 ),
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

export function initContracts(_provider, _contractInfos: Record<string, ContractInfo>) {
    Object.values(_contractInfos).map((_info) => {
        logging.info(`Loading contract ${_info.name} from address: ${_info.address}`);
        //let abi = _info.abi;
        //if (abi.abi) {
        //    abi = abi.abi;
        //}
        _info.contract = new ethers.Contract(_info.address, _info.abi, _provider);
    });
}

initContracts(PROVIDER, ROUTERS);
initContracts(PROVIDER, ERC20S);

abiDecoder.addABI(UniswapV2Router02);

async function getExchangeRate(_router: ContractInfo, _from: ContractInfo, _to: ContractInfo) {
    const fromDecimals = await _from.contract.decimals();
    const toDecimals   = await _to.contract.decimals();

    const oneWhole = ethers.utils.parseUnits("1", fromDecimals);

    const path = [_from.address, _to.address];

    logging.ultra(`${_router.name}.getAmountsOut(${oneWhole}, [${_from.address}, ${_to.address}])`);
    try {
        const exchangeRate = (await _router.contract.getAmountsOut(oneWhole, path))[1];
        const exchangeRateFormatted = ethers.utils.formatUnits(exchangeRate, toDecimals);

        logging.info(`On ${_router.name}, 1 ${_from.name} = ${exchangeRateFormatted} ${_to.name}`);
    } catch {
        logging.ultra(`On ${_router.name}, 1 ${_from.name} => ${_to.name}: PAIR NOT FOUND`);
    }
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

    await Object.values(ROUTERS).forEach(_router => {
        getExchangeRate(_router, ERC20S['WFTM'], ERC20S['USDC']);
    });
    await Object.values(ROUTERS).forEach(_router => {
        getExchangeRate(_router, ERC20S['WFTM'], ERC20S['DAI']);
    });
    await Object.values(ROUTERS).forEach(_router => {
        getExchangeRate(_router, ERC20S['WFTM'], ERC20S['MIM']);
    });

    await Object.values(ROUTERS).forEach(_router => {
        getExchangeRate(_router, ERC20S['DMD'], ERC20S['USDC']);
    });
    await Object.values(ROUTERS).forEach(_router => {
        getExchangeRate(_router, ERC20S['DMD'], ERC20S['WFTM']);
    });
    await Object.values(ROUTERS).forEach(_router => {
        getExchangeRate(_router, ERC20S['SPIRIT'], ERC20S['USDC']);
    });
    await Object.values(ROUTERS).forEach(_router => {
        getExchangeRate(_router, ERC20S['SPIRIT'], ERC20S['WFTM']);
    });
    await Object.values(ROUTERS).forEach(_router => {
        getExchangeRate(_router, ERC20S['SPELL'], ERC20S['WFTM']);
    });
    logging.info("Done...");

    PROVIDER.on("pending", (txHash) => {
        //logging.info(`Pending: ${txHash}`);
        PROVIDER.getTransaction(txHash).then(async tx => {
            if (tx && tx.to == ROUTERS['SUSHISWAP' ].address
                   || tx.to == ROUTERS['SPOOKYSWAP'].address
                   || tx.to == ROUTERS['SOULSWAP'  ].address
                   || tx.to == ROUTERS['WAKASWAP'  ].address
                   || tx.to == ROUTERS['HYPERSWAP' ].address
                   || tx.to == ROUTERS['YOSHI'     ].address) {
                console.log(`Tx (${tx.hash} uses router ${tx.to}`);
                //ethers.utils.defaultAbiCoder.decode(
                //    UniswapV2Router02,
                //    ethers.utils.hexDataSlice(tx.data, 4)
                //);
                //debugger;
                //console.log(tx);
                const decodedData = abiDecoder.decodeMethod(tx.data);
                logging.ultra(decodedData);
                if (decodedData.name == 'swapExactETHForTokens' || decodedData.name == 'swapExactTokensForTokens') {
                    const path = decodedData.params[2].value;

                    let from = path[0];
                    let to   = path[path.length-1];
                    if (decodedData.name == 'swapExactETHForTokens') {
                        from = WFTM_ADDRESS;
                        to   = path;
                    }

                    console.log(`Decoded method: ${decodedData.name} - From0: ${from} - To0: ${to}`);
                    console.log(`Path: ${path}`);

                    const fromContract = new ethers.Contract(from, ERC20, PROVIDER);
                    const toContract   = new ethers.Contract(to,   ERC20, PROVIDER);

                    try {
                        const fromName = await fromContract.symbol();
                        const toName   = await toContract.symbol();

                        console.log(`From: ${fromName}:${from}`);
                        console.log(`To:   ${toName}:${to}`);
                        console.log(`Path: ${path}`);

                        ERC20S[fromName] = new ContractInfo(fromName, from, ERC20);
                        ERC20S[fromName].contract = fromContract;
                        ERC20S[toName]   = new ContractInfo(toName, to, ERC20);
                        ERC20S[toName].contract   = toContract;

                        await Object.values(ROUTERS).forEach(_router => {
                            getPathRate(_router, ERC20S[fromName], ERC20S[toName], path);
                        });
                        await Object.values(ROUTERS).forEach(_router => {
                            getExchangeRate(_router, ERC20S[fromName], ERC20S['WFTM']);
                        });
                        // TODO check all other pairs with tokens in this path
                    } catch (e) {
                        console.log(`Skipping path: ${path} ...`);
                        //console.log(e);
                    }
                }
            }
        });
    });
}

