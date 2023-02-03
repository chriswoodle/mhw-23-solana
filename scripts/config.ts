import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import fs from "fs";
import * as anchor from "@project-serum/anchor";

anchor.setProvider(anchor.AnchorProvider.env());

const program = anchor.workspace.Staker;
const connection = anchor.getProvider().connection;
const userWallet = anchor.workspace.Staker.provider.wallet;

const randomPayer = async (lamports = LAMPORTS_PER_SOL) => {
    const wallet = Keypair.generate();
    const signature = await connection.requestAirdrop(wallet.publicKey, lamports);
    await connection.confirmTransaction(signature);
    return wallet;
}

const getShotMintAuthorityPDA = async (): Promise<[PublicKey, number]> => {
    return await getProgramDerivedAddress(shotMintAddress);
}

const getAmmoMintAuthorityPDA = async (): Promise<[PublicKey, number]> => {
    return await getProgramDerivedAddress(ammoMintAddress);
}

const getProgramDerivedAddress = (seed: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [seed.toBuffer()],
        program.programId
    );
}

const shotData = JSON.parse(fs.readFileSync(".keys/shot-token.json").toString());
const shotMintKeypair = Keypair.fromSecretKey(new Uint8Array(shotData));
const shotMintAddress = shotMintKeypair.publicKey;

const ammoData = JSON.parse(fs.readFileSync(".keys/ammo-token.json").toString());
const ammoMintKeypair = Keypair.fromSecretKey(new Uint8Array(ammoData))
const ammoMintAddress = ammoMintKeypair.publicKey;


export {
    program,
    connection,
    userWallet,
    randomPayer,
    shotMintKeypair,
    shotMintAddress,
    ammoMintKeypair,
    ammoMintAddress,
    getShotMintAuthorityPDA,
    getAmmoMintAuthorityPDA,
}
