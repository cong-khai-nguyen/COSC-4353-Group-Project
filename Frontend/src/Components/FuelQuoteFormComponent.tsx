import React, { useEffect, useState } from "react"
import {
  useGetDeliveryAddressQuery,
  useGetPriceMutation,
  useSubmitQuoteMutation,
} from "../api/apiSlice"
import "../styles/FuelQuoteFormComponent.css"
import FormTextInput, { IInput } from "./FormComponent"

// Replace with fetched CLient Address Here (Server Side stuff)
// const delivAddress = "123 Nunya ln"
// Replace with pricing module calculations
// const suggestedPrice = 2.5

interface FuelQuoteFormState {
  gallonsRequested: number
  deliveryDate: string
  deliveryAddress: string
  suggestedPrice: number
  totalPrice: number
}

export default function FuelQuoteForm() {
  const [formState, setFormState] = useState<FuelQuoteFormState>({
    gallonsRequested: 0,
    deliveryDate: "",
    deliveryAddress: "",
    suggestedPrice: 0,
    totalPrice: 0,
  })
  const [submitQuote, { isSuccess }] = useSubmitQuoteMutation()
  const [getPrice] = useGetPriceMutation()
  const { data, isSuccess: getAddressSuccess } = useGetDeliveryAddressQuery(
    undefined,
    { refetchOnMountOrArgChange: true }
  )
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    if (isSuccess) {
      setShowSuccessAlert(true)
      setOpacity(1) // Reset opacity to 1 when a new success message needs to be shown

      const timer = setTimeout(() => {
        setOpacity(0) // Start fading out the alert
      }, 4000) // Start fade out 1 second before removing from DOM

      const removeAlert = setTimeout(() => {
        setShowSuccessAlert(false) // Completely remove the alert after fade out
      }, 5000) // Remove after total 5 seconds

      return () => {
        clearTimeout(timer)
        clearTimeout(removeAlert)
      }
    }
  }, [isSuccess])

  useEffect(() => {
    if (getAddressSuccess && data && data.profile) {
      // console.log(data.profile)
      let deliveryAddress = data.profile.address1

      deliveryAddress +=
        data.profile.address2.length > 0 ? ", " + data.profile.address2 : ""
      deliveryAddress +=
        data.profile.city.length > 0 ? ", " + data.profile.city : ""
      deliveryAddress +=
        data.profile.state.length > 0 ? ", " + data.profile.state : ""
      deliveryAddress +=
        data.profile.zipcode.length > 0 ? ", " + data.profile.zipcode : ""

      // const deliveryAddress = `${addressOne}, ${addressTwo}, ${city}, ${state}`

      setFormState((prevState) => ({
        ...prevState,
        deliveryAddress: deliveryAddress,
      }))
    }
  }, [data, getAddressSuccess])

  useEffect(() => {
    // Make an API call to calculate suggested price
    const fetchPrice = async () => {
      try {
        const response = await getPrice({
          gallonsRequested: formState.gallonsRequested,
          deliveryDate: formState.deliveryDate,
          deliveryAddress: formState.deliveryAddress,
        }).unwrap()

        setFormState((prevState) => ({
          ...prevState,
          suggestedPrice: response.pricingResult.suggestedPrice,
          totalPrice: response.pricingResult.totalPrice,
        }))
      } catch (err) {
        console.log("Failed to fetch price", err)
      }
    }

    if (
      formState.gallonsRequested > 0 &&
      formState.deliveryDate.length > 0 &&
      formState.deliveryAddress.length > 0
    ) {
      // console.log("Fetching price...")
      fetchPrice()
    }
  }, [
    formState.gallonsRequested,
    formState.deliveryDate,
    formState.deliveryAddress,
    getPrice,
  ])

  // Calculates in real time as user inputs gallons requested
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    })
  }

  const forms: IInput[] = [
    {
      id: "gallonsRequested",
      name: "gallonsRequested",
      type: "number",
      label: "Gallons Requested",
      required: true,
      min: 1,
      max: 10000000,
      onChange: handleChange,
    },
    {
      id: "deliveryDate",
      name: "deliveryDate",
      type: "date",
      label: "Delivery Date",
      required: true,
      min: new Date().toISOString().split("T")[0],
      value: formState.deliveryDate,
      onChange: handleChange,
    },
    {
      id: "deliveryAddress",
      name: "deliveryAddress",
      type: "text",
      label: "Delivery Address",
      value: formState.deliveryAddress,
      disabled: true,
    },
    {
      id: "suggestedPrice",
      name: "suggestedPrice",
      type: "text",
      label: "Suggested Price",
      value:
        formState.suggestedPrice != 0 && formState.deliveryDate.length > 0
          ? `$${formState.suggestedPrice}`
          : "Input requested gallon and date",

      disabled: true,
    },
    {
      id: "totalPrice",
      name: "totalPrice",
      type: "text",
      label: "Total Amount Due",
      value:
        formState.totalPrice != 0 && formState.deliveryDate.length > 0
          ? `$${formState.totalPrice}`
          : "Input requested gallon and date",
      disabled: true,
    },
  ]

  const handleOnSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = {
      gallonsRequested: formState.gallonsRequested,
      deliveryDate: formState.deliveryDate,
      deliveryAddress: formState.deliveryAddress,
      suggestedPrice: formState.suggestedPrice,
      totalPrice: formState.totalPrice,
    }

    try {
      await submitQuote(form).unwrap()
      if (!isSuccess) {
        console.error("Failed to submit quote")
      } else {
        console.log("Quote submitted successfully")
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      {showSuccessAlert && (
        <div
          className={`flex p-4 mb-4 text-lg text-green-800 rounded-lg ${
            opacity === 1
              ? "bg-green-200 dark:bg-gray-800 dark:text-green-800"
              : "bg-green-200 dark:bg-gray-800 dark:text-green-800"
          } transition-opacity duration-1000 ease-out`}
          style={{ opacity }}
          role="alert"
        >
          <span className="font-medium">Success alert!</span> Submit quote
          successfully.
        </div>
      )}

      <div id="fuelQuoteContainer">
        <h1>Fuel Quote Form</h1>
        <form id="fuelQuoteForm" onSubmit={handleOnSubmit}>
          {forms.map((field) => (
            <FormTextInput key={field.id} {...field} />
          ))}
          <button id="submitQuote" type="submit">
            Submit Quote
          </button>
        </form>
      </div>
    </>
  )
}
