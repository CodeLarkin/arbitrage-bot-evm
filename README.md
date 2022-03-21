# Arbitrage Bot for Fantom

## Install

```
npm install
```


## Run

```
npx ts-node src/index.ts
```


## Phases

1. Detect
2. Prune
3. Execute


## Notes

* Maintain a list of token addresses and exchange addresses.
    * Automatic mechanism for updating these lists
* How should we find notable token pairs? Sort based on volume?
* Iterate through token pairs and check rates on every known DEX.
    * Note potential arbitrage opportunities (two DEXs with substantially different prices)
        * Make sure that DEXs actually have enough reserves for an opportunity to be capitalized on
* Detect complex routes (e.g.: Sell FTM for MIM on Spooky, buy FTM for MIM on Spirit)
