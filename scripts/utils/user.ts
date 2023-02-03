import {  PublicKey } from '@solana/web3.js';
import { shotMintAddress, ammoMintAddress, userWallet } from "../config"
import { Wallet } from "@project-serum/anchor";
import { TokenHelper } from "./token-helper";

export class User {
    shotToken: TokenHelper;
    shotTokenBag: PublicKey;
    ammoToken: TokenHelper;
    ammoTokenBag: PublicKey;
    wallet: Wallet;

    constructor(wallet = userWallet) {
        this.shotToken = new TokenHelper(shotMintAddress);
        this.ammoToken = new TokenHelper(ammoMintAddress);
        this.wallet = wallet;
    }

    getOrCreateShotTokenBag = async () => {
       this.shotTokenBag = (await this.shotToken.getOrCreateTokenBag(this.wallet.publicKey)).address;
    }

    getOrCreateAmmoTokenBag = async () => {
        this.ammoTokenBag = (await this.ammoToken.getOrCreateTokenBag(this.wallet.publicKey)).address;
    }

    shotBalance = async () => {
        return await this.shotToken.balance(this.shotTokenBag);
    }

    ammoBalance = async () => {
        return await this.ammoToken.balance(this.ammoTokenBag);
    }
}