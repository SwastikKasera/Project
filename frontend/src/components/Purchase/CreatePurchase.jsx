import axios from "axios";
import React, {useEffect, useState} from "react";
import AsyncSelect from "react-select/async";
import Cookies from "js-cookie";

const CreatePurchase = () => {
  const [customerData, setCustomerData] = useState({
    companyId: "",
    customerAddress: "",
    customerEmail: "",
    customerGSTIN: "",
    customerMobile: "",
    customerName: "",
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [addedItemDetails, setAddedItemDetails] = useState(null);

  useEffect(() => {
    // console.log("Updated selectedItem:", selectedItem);
  }, [selectedItem]);

  const loadCustomerOptions = async (inputValue, callback) => {
    try {
      const token = Cookies.get("JWT_token");
      const response = await axios.get(`http://localhost:4000/c/search?search=${inputValue}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const options = response.data.f_data.map((customer) => ({
        label: customer.customerName,
        value: customer._id,
      }));
      callback(options);
    } catch (error) {
      console.error("Error fetching customer options:", error);
    }
  };

  const loadItemOptions = async (inputValue, callback) => {
    try {
      const token = Cookies.get("JWT_token");
      const response = await axios.get(`http://localhost:4000/i/search?search=${inputValue}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const options = response.data.f_data.map((item) => ({
        label: item.itemName,
        value: item._id,
        rate: item.itemRate,
        hsnCode: item.itemHSNcode,
        tax: item.itemTax,
      }));
      callback(options);
    } catch (error) {
      console.error("Error fetching item options:", error);
    }
  };

  const handleCustomerChange = async (selectedOption) => {
    setSelectedCustomer(selectedOption);
    if (selectedOption) {
      const customerId = selectedOption.value;
      try {
        const token = Cookies.get("JWT_token");
        const response = await axios.get(`http://localhost:4000/c/get/${customerId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCustomerData(response.data.info);
      } catch (error) {
        console.log("Error in handleCustomer change", error);
      }
    }
  };

  const handleItemChange = async (selectedOption) => {
    setSelectedItem(selectedOption);
  };

  const searchDropdownStyle = {
    control: (style) => ({
      ...style,
      height: "48px",
      backgroundColor: "#062A20",
      color: "#DCFCB6",
      border: "1px solid #DCFCB6",
      borderRadius: "0px",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#DCFCB6",
    }),
    input: (provided) => ({
      ...provided,
      color: "#DCFCB6",
      border: "none",
      outline: "none",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#8DA66F",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#DCFCB6' : 'white',
      color: "#062A20",
      fontWeight: 'bold'
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      backgroundColor: "#DCFCB6",
      color: "#062A20",
      margin: "0",
      fontWeight: 'bold'
    }),
    menuList: (provided) => ({
      ...provided,
      backgroundColor: "#062A20",
      color: "#DCFCB6",
      margin: "0",
    }),
  };

  const handleAddButtonClick = async () => {
    // console.log("Before update:", selectedItems);
    if (selectedItem) {
      const totalAmount = selectedItem.rate * selectedItem.quantity;
      try {
        const additionalItemData = await fetchItemData(selectedItem.value);
        // console.log("additionalItemData:", additionalItemData);

        if (additionalItemData) {
          setAddedItemDetails({
            itemId: selectedItem.value,
            itemName: selectedItem.label,
            itemHSNcode: additionalItemData.itemHSNcode,
            quantity: selectedItem.quantity,
            rate: selectedItem.rate,
            tax: selectedItem.tax,
            unit: selectedItem.unit,
            totalAmount: totalAmount,
          });

          setShowItemDetails(true);

          const newItem = {
            itemId: selectedItem.value,
            itemName: selectedItem.label,
            itemHSNcode: additionalItemData.itemHSNcode,
            quantity: selectedItem.quantity,
            rate: selectedItem.rate,
            tax: selectedItem.tax,
            unit: selectedUnit,
            totalAmount: totalAmount,
          };
          setSelectedItems((prevSelectedItems) => [...prevSelectedItems, newItem]);
        } else {
          console.log("Additional item data is null or empty.");
        }
      } catch (error) {
        console.error("Error fetching additional item data:", error);
      }
    }
    // console.log("After update:", selectedItems);
  };

  const fetchItemData = async (itemId) => {
    try {
      const token = Cookies.get("JWT_token");
      const response = await axios.get(`http://localhost:4000/i/get/${itemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("response.info", response.data.info[0]);
      return response.data.info[0];
    } catch (error) {
      console.error("Error fetching item data:", error);
    }
  };

  function calculateAmountExGst(itemTotal, tax) {
    let gst = ((itemTotal * tax) / (100 + tax)).toFixed(2);
    return (itemTotal - gst).toFixed(2);
  }

  const handleRemoveItem = (indexToRemove) => {
    setSelectedItems((prevSelectedItems) => prevSelectedItems.filter((item, index) => index !== indexToRemove));
  };
  return (
    <>
      <div className="ml-64 flex px-2 gap-4">
        <div className="bg-darkGreen px-2 w-9/12 h-fit">
          <h1 className="text-3xl text-white text-center p-4">Create Purchase</h1>
          <div>
            <p className="text-white mt-12">Choose Customer</p>
            <AsyncSelect
              className="mt-4"
              components={{DropdownIndicator: () => null, IndicatorSeparator: () => null}}
              cacheOptions
              loadOptions={loadCustomerOptions}
              defaultOptions
              onChange={handleCustomerChange}
              placeholder="Search customer"
              styles={searchDropdownStyle}
              isClearable
            />
          </div>
          <div>
            <p className="text-white mt-10">Add item</p>
            <div className="mt-4 flex justify-between w-full ">
              <AsyncSelect
                className="w-64  h-12 border-secondary border-1  placeholder:text-lightGreen"
                components={{DropdownIndicator: () => null, IndicatorSeparator: () => null}}
                cacheOptions
                loadOptions={loadItemOptions}
                defaultOptions
                onChange={handleItemChange}
                placeholder="Search item"
                styles={searchDropdownStyle}
                isClearable
              />
              <input
                className="bg-darkGreen  h-12 w-28 border-secondary border-1 text-secondary placeholder:text-lightGreen"
                type="number"
                value={selectedItem?.quantity || ""}
                onChange={(e) => setSelectedItem({...selectedItem, quantity: e.target.value})}
                placeholder="Quantity"
              />
              <input
                className="bg-darkGreen  border-secondary border-1 h-12 w-28 text-secondary placeholder:text-lightGreen"
                type="number"
                value={selectedItem?.rate || ""}
                onChange={(e) => setSelectedItem({...selectedItem, rate: e.target.value})}
                placeholder="Rate"
              />
              <select
                className="bg-darkGreen  h-12 border-secondary border-1 text-secondary placeholder:text-lightGreen"
                onChange={(e) => setSelectedUnit(e.target.value)}
                name="unitselect"
                id="">
                <option
                  value=""
                  default
                  selected
                  disabled>
                  --Unit--
                </option>
                <option value="PCS">PCS</option>
                <option value="KG">KG</option>
                <option value="L">L</option>
                <option value="PKT">PKT</option>
              </select>
              <button
                className="bg-primary text-lg text-black font-bold px-8 py-2 "
                onClick={handleAddButtonClick}>
                Add
              </button>
            </div>
          </div>
          {showItemDetails && (
            <div className="p-4 mt-4 flex flex-col justify-center ">
              {console.log("Itemdata", selectedItems)}
              <div>
                {selectedItems.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => handleRemoveItem(index)}
                    className="flex h-fit max-w-lg bg-[#09382A] mt-4 flex-col p-4 relative cursor-pointer">
                    <div>
                      <p className="text-white">{index + 1}.</p>
                    </div>
                    <div className="flex items-end justify-between gap-[4px]">
                      <div className="">
                        <h1 className="text-2xl text-white">{item.itemName}</h1>
                      </div>
                      <div>
                        <p className="w-fit text-center  bg-[#DCFD52] px-3 py-2 text-xl font-bold">{item.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex justify-around mt-12">
                      <div className="flex flex-col justify-center items-center">
                        <p className="text-white text-sm">HSN Code</p>
                        <p className="text-[#DCFD52] text-xl">{item.itemHSNcode}</p>
                      </div>
                      <div className="flex flex-col justify-center items-center">
                        <p className="text-white text-sm">Tax</p>
                        <p className="text-[#DCFD52] text-xl">{item.tax}</p>
                      </div>
                      <div className="flex flex-col justify-center items-center">
                        <p className="text-white text-sm">Qty</p>
                        <p className="text-[#DCFD52] text-xl">{item.quantity}</p>
                      </div>
                      <div className="flex flex-col justify-center items-center">
                        <p className="text-white text-sm">Unit</p>
                        <p className="text-[#DCFD52] text-xl">{item.unit}</p>
                      </div>
                      <div className="flex flex-col justify-center items-center">
                        <p className="text-white text-sm">Rate</p>
                        <p className="text-[#DCFD52] text-xl">{item.rate}</p>
                      </div>
                      <div className="flex flex-col justify-center items-center">
                        <p className="text-white text-sm">Amount ex GST</p>
                        <p className="text-[#DCFD52] text-xl">{calculateAmountExGst(item.rate * item.quantity, item.tax)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="bg-deeperGreen py-4 px-6 w-3/12 h-fit mt-4">
          <div className="">
            <p className="text-center text-white text-lg">Customer Details</p>
          </div>
          <div className="flex flex-col">
            <div>
              <p className="text-primary mt-6 text-sm">Customer Name:</p>
              {selectedCustomer && customerData.length > 0 && (
                <>
                  <p className="text-white text-lg">{customerData[0].customerName}</p>
                </>
              )}
            </div>
            <div>
              <p className="text-primary text-sm mt-4">Customer Email:</p>
              {selectedCustomer && customerData.length > 0 && (
                <>
                  <p className="text-white text-lg">{customerData[0].customerEmail}</p>
                </>
              )}
            </div>
            <div>
              <p className="text-primary text-sm mt-4">Customer Phone:</p>
              {selectedCustomer && customerData.length > 0 && (
                <>
                  <p className="text-white text-lg">{customerData[0].customerMobile}</p>
                </>
              )}
            </div>
            <div>
              <p className="text-primary text-md mt-4">Customer Address:</p>
              {selectedCustomer && customerData.length > 0 && (
                <>
                  <p className="text-lg text-white">{customerData[0].customerAddress}</p>
                </>
              )}
            </div>
            <hr className="mt-4 mb-4"/>
            <div className="w-full h-full bg-secondary font-bold flex flex-col justify-center items-center">
              <p className="pt-6">Total Amount</p>
              <h1 className="text-4xl text-black font-bold pt-3 pb-6">{selectedItems.reduce((total, item) => total + item.totalAmount, 0).toFixed(2)}</h1>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatePurchase;
