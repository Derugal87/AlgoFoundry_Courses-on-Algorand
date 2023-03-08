import sys
sys.path.insert(0,'.')

from algobpy.parse import parse_params
from pyteal import *

def htlc(acc1_addr, acc2_addr, hash, timeout):

    # write your code here
    basic_checks = And(
        Txn.type_enum() == TxnType.Payment,
        Txn.rekey_to() == Global.zero_address(),
        Txn.close_remainder_to() == Global.zero_address(),
        Txn.fee() <= Int(1000)
    )

    fund_withdrawal_check = And(
        basic_checks,
        Sha256(Arg(0)) == Bytes("base64", hash)
    )

    fund_recovery_check = And(
        basic_checks,
        Txn.first_valid() > Int(timeout)
    )

    program = Cond(
        [Txn.receiver() == Bytes(acc2_addr), fund_withdrawal_check],
        [Txn.receiver() == Bytes(acc1_addr), fund_recovery_check]
    )

    return program

if __name__ == "__main__":
    # Default receiver address used if params are not supplied when deploying this contract
    params = {
        "acc1": "R4VDREHBHVETKRPBZT6IDOQQL4FBHLBYQBQQJPIBXLTCVXYJX7Z5WLDSZY",
        "acc2": "WRBVLPUHQZ5O2UIZAKYKKMOUSNPOFIL6ALUZQZLHBDUSIKXHAEEIELWBFQ",
        "hash": "QzYhq9JlYbn2QdOMrhyxVlNtNjeyvyJc/I8d8VAGfGc=",
        "timeout": 3001
    }

    # Overwrite params if sys.argv[1] is passed
    if(len(sys.argv) > 1):
        params = parse_params(sys.argv[1], params)

    print(compileTeal(htlc(
        params["acc1"], 
        params["acc2"], 
        params["hash"], 
        params["timeout"]), mode=Mode.Signature, version=6))