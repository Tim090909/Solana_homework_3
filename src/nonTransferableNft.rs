use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{rent::Rent, Sysvar},
};
use spl_token::{
    instruction::{freeze_account, initialize_mint, mint_to},
    state::Mint,
};

entrypoint!(process_instruction);

fn initialize_non_transferable_nft(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let mint_account = next_account_info(account_iter)?;
    let rent_account = next_account_info(account_iter)?;
    let mint_authority = next_account_info(account_iter)?;
    let freeze_authority = next_account_info(account_iter)?;

    initialize_mint(
        program_id,
        mint_account.key,
        mint_authority.key,
        Some(freeze_authority.key),
        0,
    )?;

    msg!("NFT mint initialized");
    Ok(())
}

fn mint_non_transferable_nft(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let mint_account = next_account_info(account_iter)?;
    let destination_account = next_account_info(account_iter)?;
    let mint_authority = next_account_info(account_iter)?;

    mint_to(
        program_id,
        mint_account.key,
        destination_account.key,
        mint_authority.key,
        &[],
        1,
    )?;

    freeze_account(
        program_id,
        destination_account.key,
        mint_account.key,
        mint_authority.key,
        &[],
    )?;

    msg!("NFT minted");
    Ok(())
}

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
     let instruction = instruction_data[0];

    match instruction {
        0 => {
            initialize_non_transferable_nft(program_id, accounts)?;
            msg!("Init NFT");
        }
        1 => {
            mint_non_transferable_nft(program_id, accounts, instruction_data)?;
            msg!("Mint the NFT");
        }
        _ => msg!("Invalid instruction"),
    }
    Ok(())
}
