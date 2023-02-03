use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod staker {
    pub const AMMO_MINT_ADDRESS: &str = "DQ837hZid3pWBzjcunMr9hWH41cFyRp2XmJXb9upoKLA";
    pub const SHOT_MINT_ADDRESS: &str = "5ybrdK8qNccs685v5ZQTFTpJjBhjKMZYSBMrwXREMfcz";


    use super::*;

    pub fn create_shot_token_bag(
        ctx: Context<CreateShotTokenBag>
    ) -> Result<()> {
        Ok(())
    }

    pub fn stake(
        ctx: Context<Stake>,
        ammo_mint_authority_bump: u8,
        program_shot_bag_bump: u8,
        shot_amount: u64
    ) -> Result<()> {


        // ************************************************************
        // 1. Ask SPL Token Program to mint 🎯 to the user.
        // ************************************************************

        let ammo_amount = shot_amount; // TODO: Change the formula

        // We know that:
        //                                  findPDA(programId + seed)
        // ammoMintPDA, ammoMintPDABump = findPDA(programId + ammoMint.address)

        // -> So signer can be found using:
        // findPDA(programId + seed)              = X + bump
        // findPDA(programId + ammoMintAddress)  = X + bump
        let ammo_mint_address= ctx.accounts.ammo_mint.key();
        let seeds = &[ammo_mint_address.as_ref(), &[ammo_mint_authority_bump]];
        let signer = [&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.ammo_mint.to_account_info(),
                to: ctx.accounts.user_ammo_token_bag.to_account_info(),
                authority: ctx.accounts.ammo_mint_authority.to_account_info(),
            },
            &signer
        );
        token::mint_to(cpi_ctx, ammo_amount)?;



        // ************************************************************
        // 2. Ask SPL Token Program to transfer 🔫 from the user.
        // ************************************************************
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.user_shot_token_bag.to_account_info(),
                authority: ctx.accounts.user_shot_token_bag_authority.to_account_info(),
                to: ctx.accounts.program_shot_token_bag.to_account_info(),
            }
        );
        token::transfer(cpi_ctx, shot_amount)?;


        Ok(())
    }


    pub fn unstake(
        ctx: Context<UnStake>,
        program_shot_bag_bump: u8,
        ammo_amount: u64
    ) -> Result<()> {

        // ************************************************************
        // 1. Ask SPL Token Program to burn user's 🎯.
        // ************************************************************

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Burn {
                mint: ctx.accounts.ammo_mint.to_account_info(),
                from: ctx.accounts.user_ammo_token_bag.to_account_info(),
                authority: ctx.accounts.user_ammo_token_bag_authority.to_account_info(),
            },
        );
        token::burn(cpi_ctx, ammo_amount)?;



        // ************************************************************
        // 2. Ask SPL Token Program to transfer back 🔫 to the user.
        // ************************************************************

        // See why we did this in `fn stake()`
        let shot_mint_address= ctx.accounts.shot_mint.key();
        let seeds = &[shot_mint_address.as_ref(), &[program_shot_bag_bump]];
        let signer = [&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.program_shot_token_bag.to_account_info(),
                authority: ctx.accounts.program_shot_token_bag.to_account_info(),
                to: ctx.accounts.user_shot_token_bag.to_account_info()
            },
            &signer
        );

        let shot_amount = ammo_amount; // TODO: Change the formula
        token::transfer(cpi_ctx, shot_amount)?;

        Ok(())
    }
}



#[derive(Accounts)]
pub struct CreateShotTokenBag<'info> {
    // 1. PDA (so pubkey) for the soon-to-be created shot token bag for our program.
    #[account(
        init,
        payer = payer,
        // We use the token mint as a seed for the mapping -> think "HashMap[seeds+bump] = pda"
        seeds = [ SHOT_MINT_ADDRESS.parse::<Pubkey>().unwrap().as_ref() ],
        bump,
        // Token Program wants to know what kind of token this token bag is for
        token::mint = shot_mint,
        // It's a PDA so the authority is itself!
        token::authority = program_shot_token_bag,
    )]
    pub program_shot_token_bag: Account<'info, TokenAccount>,


    // 2. The mint 🔫🪙 because it's needed from above ⬆️ token::mint = ...
    #[account(
        address = SHOT_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub shot_mint: Account<'info, Mint>,


    // 3. The rent payer
    #[account(mut)]
    pub payer: Signer<'info>,


    // 4. Needed from Anchor for the creation of an Associated Token Account
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}



#[derive(Accounts)]
#[instruction(ammo_mint_authority_bump: u8, program_shot_bag_bump: u8)]
pub struct Stake<'info> {
    // SPL Token Program
    pub token_program: Program<'info, Token>,


    // ***********
    // MINTING 🎯 TO USERS
    // ***********

    // Address of the ammo mint 🏭🎯
    #[account(
    mut,
    address = AMMO_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub ammo_mint: Account<'info, Mint>,

    // The authority allowed to mutate the above ⬆️
    // And Print Stake Tokens
    /// CHECK: only used as a signing PDA
    #[account(
    seeds = [ ammo_mint.key().as_ref() ],
    bump = ammo_mint_authority_bump,
    )]
    pub ammo_mint_authority: UncheckedAccount<'info>,

    // Associated Token Account 💰 for User to receive 🎯
    #[account(mut)]
    pub user_ammo_token_bag: Account<'info, TokenAccount>,




    // ***********
    // TRANSFERING 🔫 FROM USERS
    // ***********

    // Associated Token Account for User which holds 🔫.
    #[account(mut)]
    pub user_shot_token_bag: Account<'info, TokenAccount>,

    // The authority allowed to mutate the above ⬆️
    pub user_shot_token_bag_authority: Signer<'info>,

    // Used to receive 🔫 from users
    #[account(
        mut,
        seeds = [ shot_mint.key().as_ref() ],
        bump = program_shot_bag_bump,
    )]
    pub program_shot_token_bag: Account<'info, TokenAccount>,

    // Require for the PDA above ⬆️
    #[account(
        address = SHOT_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub shot_mint: Account<'info, Mint>,
}


#[derive(Accounts)]
#[instruction(program_shot_bag_bump: u8)]
pub struct UnStake<'info> {
    // SPL Token Program
    pub token_program: Program<'info, Token>,


    // ***********
    // BURNING USER'S 🎯
    // ***********

    // see `token::Burn.mint`
    #[account(
        mut,
        address = AMMO_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub ammo_mint: Account<'info, Mint>,

    // see `token::Burn.to`
    #[account(mut)]
    pub user_ammo_token_bag: Account<'info, TokenAccount>,

    // The authority allowed to mutate the above ⬆️
    pub user_ammo_token_bag_authority: Signer<'info>,



    // ***********
    // TRANSFER 🔫 TO USERS
    // ***********

    // see `token::Transfer.from`
    #[account(
        mut,
        seeds = [ shot_mint.key().as_ref() ],
        bump = program_shot_bag_bump,
    )]
    pub program_shot_token_bag: Account<'info, TokenAccount>,

    // see `token::Transfer.to`
    #[account(mut)]
    pub user_shot_token_bag: Account<'info, TokenAccount>,

    // Require for the PDA above ⬆️
    #[account(
        address = SHOT_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub shot_mint: Box<Account<'info, Mint>>,
}
