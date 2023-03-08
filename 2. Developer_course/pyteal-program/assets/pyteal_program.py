# Contract Account

# Add directory to path so that algobpy can be imported
import sys
sys.path.insert(0,'.')

from algobpy.parse import parse_params
from pyteal import *

def main(RECEIVER_1, RECEIVER_2):

    # Write your code here
    commons_checks  = And(
        Txn.rekey_to() == Global.zero_address(),
        Txn.close_remainder_to() == Global.zero_address()
    )

    # receiver_1
    receiver_1_check = And(
        Txn.amount() <= Int(5000000),
        Arg(0) == Bytes("rcv1password")
    )

    # receiver_2
    receiver_2_check = And(
        Txn.amount() <= Int(10000000),
        Arg(0) == Bytes("rcv2password")
    )

    # receiver_checks
    receiver_checks = Cond(
        [Txn.receiver() == Addr(RECEIVER_1), receiver_1_check],
        [Txn.receiver() == Addr(RECEIVER_2), receiver_2_check]
    )

    program = And(
        commons_checks,
        receiver_checks
    )

    return program

if __name__ == "__main__":
    params = {
        "RECEIVER_1": "R4VDREHBHVETKRPBZT6IDOQQL4FBHLBYQBQQJPIBXLTCVXYJX7Z5WLDSZY",
        "RECEIVER_2": "WRBVLPUHQZ5O2UIZAKYKKMOUSNPOFIL6ALUZQZLHBDUSIKXHAEEIELWBFQ",
    }

    # Overwrite params if sys.argv[1] is passed
    if(len(sys.argv) > 1):
        params = parse_params(sys.argv[1], params)

    print(compileTeal(main(params["RECEIVER_1"], params["RECEIVER_2"]), Mode.Signature, version=6))
