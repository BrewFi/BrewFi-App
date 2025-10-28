import { useAccount } from "wagmi"

const ReadData = () => {
  const { address } = useAccount();

  return (
    <div>

      {address ? (
        <div className="mt-12">
          <div className="flex justify-between items-center py-2 px-3 bg-neutral-900 rounded border border-neutral-100">
            <span className="text-sm font-medium text-neutral-100">Connected Address:</span>
            <span className="text-sm text-neutral-200">{address || "Loading..."}</span>
          </div>
        </div>
      ) : (
        <p className="mt-12">Connect your wallet to view your address</p>
      )}
    </div>
  )
}

export default ReadData