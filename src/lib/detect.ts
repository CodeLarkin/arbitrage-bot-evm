import { ethers, Contract, ContractInterface } from "ethers";
import { BigNumber } from '@ethersproject/bignumber';

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

async function getExchangeRate(_router: ContractInfo, _from: ContractInfo, _to: ContractInfo) {
    const fromDecimals = await _from.contract.decimals();
    const toDecimals   = await _to.contract.decimals();

    const oneWhole = ethers.utils.parseUnits("1", fromDecimals);

    const path = [_from.address, _to.address];

    logging.ultra(`${_router.name}.getAmountsOut(${oneWhole}, [${_from.address}, ${_to.address}])`);
    const exchangeRate = (await _router.contract.getAmountsOut(oneWhole, path))[1];
    const exchangeRateFormatted = ethers.utils.formatUnits(exchangeRate, toDecimals);

    logging.info(`On ${_router.name}, 1 ${_from.name} = ${exchangeRateFormatted} ${_to.name}`);
}

export async function detect() {
    logging.info("Detecting...");

    Object.values(ROUTERS).forEach(_router => {
        getExchangeRate(_router, ERC20S['WFTM'], ERC20S['USDC']);
    });

    PROVIDER.on("pending", (txHash) => {
        //logging.info(`Pending: ${txHash}`);
        PROVIDER.getTransaction(txHash).then(tx => {
            if (tx.to == ROUTERS['SPOOKYSWAP'].address) {
                //ethers.utils.defaultAbiCoder.decode(
                //    UniswapV2Router02,
                //    ethers.utils.hexDataSlice(tx.data, 4)
                //);
                debugger;
                console.log(tx);
            }
        });
    });
}

