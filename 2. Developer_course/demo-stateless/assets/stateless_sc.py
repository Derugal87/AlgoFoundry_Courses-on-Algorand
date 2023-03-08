from pyteal import *

def stateless_sc():

    def basic_checks(txn: Txn): return And(
        txn.rekey_to() == Global.zero_address(),
        txn.close_remainder_to() == Global.zero_address()
    )

    '''
    Check if txn amount is less than 1 Algo and the correct receiver
    '''
    program = And(
        basic_checks(Txn),
        Txn.amount() <= Int(1000000),
        Txn.receiver() == Addr("53TDLZLXN6PYX6Q55Z6GAEACDOO2GQEX3ZHWP664W3C6UJVZAH427P7TII")
    )

    return program

if __name__ == "__main__":
    print(compileTeal(stateless_sc(), mode=Mode.Signature, version=6))