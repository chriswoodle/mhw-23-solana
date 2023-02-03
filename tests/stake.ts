import { expect } from 'chai';
import * as anchor from "@project-serum/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  ammoMintAddress,
  shotMintAddress,
  program,
  getAmmoMintAuthorityPDA
} from "../scripts/config"
import { User } from "../scripts/utils/user";
import { createMints } from "../scripts/mint-tokens";
import { airdropShot } from "../scripts/airdrop";
import { TokenHelper } from "../scripts/utils/token-helper";



describe("staker", () => {

  before(async () => {
    await createMints();
    await airdropShot();
  });


  it('It creates the program 🎯💰 shot token bag', async () => {
    const user = new User();
    const [shotPDA, _] = getProgramShotTokenBagPDA();

    await program.rpc.createShotTokenBag({
      accounts: {
        shotMint: shotMintAddress,
        programShotTokenBag: shotPDA,
        payer: user.wallet.publicKey,

        // Solana is lost: where are my spl program friends?
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      }
    });

    const tokenHelper = new TokenHelper(shotMintAddress);
    expect(await tokenHelper.balance(shotPDA)).to.be.eql(0);
  });


  it('It swaps $🔫 for $🎯', async () => {
    // 0. Prepare Token Bags
    const user =  new User();
    await user.getOrCreateAmmoTokenBag();
    await user.getOrCreateShotTokenBag()

    // 1. Get current ammo amount
    const userAmmos = await user.ammoBalance();
    const userShots = await user.shotBalance();

    // For the MINT
    const [ammoPDA, ammoPDABump] = await getAmmoMintAuthorityPDA();
    // For the TRANSFER
    const [shotBagPDA, shotBagBump] = await getProgramShotTokenBagPDA();

    // 2. Execute our stuff
    await program.rpc.stake(
        ammoPDABump,
        shotBagBump,
        new anchor.BN(5_000),
        {
          accounts: {
            // Solana is lost: where are my spl program friends?
            tokenProgram: TOKEN_PROGRAM_ID,

            // **************
            // MINTING 🔫 TO USERS
            // **************
            ammoMint: ammoMintAddress,
            ammoMintAuthority: ammoPDA,
            userAmmoTokenBag: user.ammoTokenBag,


            // **************
            // TRANSFERING 🎯 FROM USERS
            // **************
            userShotTokenBag: user.shotTokenBag,
            userShotTokenBagAuthority: user.wallet.publicKey,
            programShotTokenBag: shotBagPDA,
            shotMint: shotMintAddress,
          },
        },
    );

    // 3. Tests

    // We expect the user to have received 5_000 $🔫
    expect(await user.ammoBalance()).to.be.eql(userAmmos + 5_000);

    // We expect the user to have paid 5_000 $🎯 to the program.
    expect(await user.shotBalance()).to.be.eql(userShots - 5_000);
    const tokenHelper = new TokenHelper(shotMintAddress);
    expect(await tokenHelper.balance(shotBagPDA)).to.be.eql(5_000)
  });

  it('It redeems 🔫 for 🎯', async () => {
    // 0. Prepare Token Bags
    const user = new User();
    await user.getOrCreateAmmoTokenBag();
    await user.getOrCreateShotTokenBag()
    // For the TRANSFER
    const [shotBagPDA, shotBagBump] = getProgramShotTokenBagPDA();

    // 1. Get current ammo amount
    const userAmmos = await user.ammoBalance();
    const userShots = await user.shotBalance();

    // 2. Execute our stuff
    await program.rpc.unstake(
        shotBagBump,
        new anchor.BN(5_000),
        {
          accounts: {
            tokenProgram: TOKEN_PROGRAM_ID,

            // **************
            // BURNING USER'S 🔫
            // **************
            ammoMint: ammoMintAddress,
            userAmmoTokenBag: user.ammoTokenBag,
            userAmmoTokenBagAuthority: user.wallet.publicKey,


            // **************
            // TRANSFER 🎯 TO USERS
            // **************
            programShotTokenBag: shotBagPDA,
            userShotTokenBag: user.shotTokenBag,
            shotMint: shotMintAddress,
          },
        }
    );

    // 3. Tests

    // We expect the user to have redeem $🔫 to the program.
    expect(await user.ammoBalance()).to.be.eql(userAmmos - 5_000);

    // We expect the user to have received 5_000 shot $🎯 back.
    expect(await user.shotBalance()).to.be.eql(userShots + 5_000);
  });

})

const getProgramShotTokenBagPDA = (): [PublicKey, number] => {
  const seed = shotMintAddress;

  return PublicKey.findProgramAddressSync(
      [seed.toBuffer()],
      program.programId
  );
}